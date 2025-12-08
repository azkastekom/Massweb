import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as Handlebars from 'handlebars';
import { GeneratedContent, PublishStatus } from '../entities/generated-content.entity';
import { Project } from '../entities/project.entity';
import { CsvRow } from '../entities/csv-row.entity';
import { PublishJob, JobStatus } from '../entities/publish-job.entity';

@Injectable()
export class ContentGeneratorService {
    constructor(
        @InjectRepository(GeneratedContent)
        private contentRepository: Repository<GeneratedContent>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(CsvRow)
        private csvRowRepository: Repository<CsvRow>,
        @InjectRepository(PublishJob)
        private publishJobRepository: Repository<PublishJob>,
        @InjectQueue('content-generation')
        private generationQueue: Queue,
        @InjectQueue('content-publishing')
        private publishQueue: Queue,
    ) { }

    async generateContent(projectId: string): Promise<{ jobId: string; totalRows: number }> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Count rows instead of loading them all
        const totalRows = await this.csvRowRepository.count({
            where: { projectId },
        });

        const job = await this.generationQueue.add('generate-content', {
            projectId,
            totalRows,
        });

        return {
            jobId: job.id.toString(),
            totalRows,
        };
    }

    async generateContentSync(projectId: string): Promise<{ generatedCount: number }> {
        // Fetch project WITHOUT loading csvRows relation
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        await this.contentRepository.delete({ projectId });

        // Get just the first row to determine columns (don't load all rows)
        const firstRow = await this.csvRowRepository.findOne({
            where: { projectId },
            order: { rowOrder: 'ASC' },
        });

        if (!firstRow) {
            throw new Error('No CSV data found');
        }

        const allColumnNames = Object.keys(firstRow.rowData);

        let columnsToUse: string[];
        if (project.titleTemplate) {
            columnsToUse = this.extractColumnsFromTemplate(project.titleTemplate, allColumnNames);
        } else {
            columnsToUse = allColumnNames;
        }

        // Stream through CSV rows to collect unique values (don't load all at once)
        const columnValues: Record<string, Set<string>> = {};
        for (const columnName of columnsToUse) {
            columnValues[columnName] = new Set<string>();
        }

        // Also get first value for non-combination columns
        const firstValuesForOtherColumns: Record<string, string> = {};
        for (const columnName of allColumnNames) {
            if (!columnsToUse.includes(columnName)) {
                firstValuesForOtherColumns[columnName] = firstRow.rowData[columnName] || '';
            }
        }

        // Stream through rows in batches to collect unique values
        const FETCH_BATCH_SIZE = 500;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const rows = await this.csvRowRepository.find({
                where: { projectId },
                order: { rowOrder: 'ASC' },
                skip: offset,
                take: FETCH_BATCH_SIZE,
            });

            if (rows.length === 0) {
                hasMore = false;
                break;
            }

            for (const row of rows) {
                for (const columnName of columnsToUse) {
                    const value = row.rowData[columnName];
                    if (value && value.trim()) {
                        columnValues[columnName].add(value.trim());
                    }
                }
                // Get first non-empty value for other columns
                for (const columnName of allColumnNames) {
                    if (!columnsToUse.includes(columnName) && !firstValuesForOtherColumns[columnName]) {
                        if (row.rowData[columnName]) {
                            firstValuesForOtherColumns[columnName] = row.rowData[columnName];
                        }
                    }
                }
            }

            offset += rows.length;
            if (rows.length < FETCH_BATCH_SIZE) {
                hasMore = false;
            }
        }

        // Convert sets to arrays for combination generation
        const columnValuesArray: Record<string, string[]> = {};
        for (const columnName of columnsToUse) {
            columnValuesArray[columnName] = Array.from(columnValues[columnName]);
        }

        // Safety check: limit combinations to prevent memory exhaustion
        const MAX_COMBINATIONS = 10000;
        let estimatedCombinations = 1;
        for (const columnName of columnsToUse) {
            estimatedCombinations *= (columnValuesArray[columnName]?.length || 1);
            if (estimatedCombinations > MAX_COMBINATIONS) {
                throw new Error(`Too many combinations (${estimatedCombinations}+). Maximum allowed is ${MAX_COMBINATIONS}. Consider reducing unique values in your title template columns or using fewer columns.`);
            }
        }

        // Compile templates once
        const contentTemplate = Handlebars.compile(project.template);
        const titleTemplate = project.titleTemplate ? Handlebars.compile(project.titleTemplate) : null;
        const metaDescriptionTemplate = project.metaDescriptionTemplate
            ? Handlebars.compile(project.metaDescriptionTemplate)
            : null;
        const tagsTemplate = project.tagsTemplate ? Handlebars.compile(project.tagsTemplate) : null;

        // Generate combinations iteratively and save in batches
        const usedSlugs = new Set<string>();
        let generatedCount = 0;
        const SAVE_BATCH_SIZE = 100;
        let currentBatch: GeneratedContent[] = [];

        // Iterative combination generation (no recursion, no intermediate objects)
        const columnNamesList = columnsToUse;
        const columnLengths = columnNamesList.map(name => columnValuesArray[name].length);
        const totalCombinations = columnLengths.reduce((a, b) => a * b, 1);

        for (let i = 0; i < totalCombinations; i++) {
            // Calculate indices for this combination
            const data: Record<string, string> = { ...firstValuesForOtherColumns };
            let temp = i;
            for (let j = columnNamesList.length - 1; j >= 0; j--) {
                const columnName = columnNamesList[j];
                const values = columnValuesArray[columnName];
                const idx = temp % values.length;
                data[columnName] = values[idx];
                temp = Math.floor(temp / values.length);
            }

            // Generate content
            const content = contentTemplate(data);
            const title = titleTemplate ? titleTemplate(data) : this.generateDefaultTitle(data);
            const metaDescription = metaDescriptionTemplate ? metaDescriptionTemplate(data) : '';
            const tags = tagsTemplate ? tagsTemplate(data) : '';

            const slugBase = this.generateSlug(title, '');
            const slug = `${projectId}/${slugBase}`;

            if (usedSlugs.has(slug)) {
                continue;
            }
            usedSlugs.add(slug);

            const generatedContent = this.contentRepository.create({
                projectId,
                content,
                title,
                metaDescription,
                tags,
                slug,
                thumbnailUrl: project.thumbnailUrl || undefined, // Use project thumbnail
                publishStatus: PublishStatus.PENDING,
            });

            currentBatch.push(generatedContent);

            // Save batch when it reaches the limit
            if (currentBatch.length >= SAVE_BATCH_SIZE) {
                await this.contentRepository.save(currentBatch);
                generatedCount += currentBatch.length;
                currentBatch = []; // Clear batch from memory
            }
        }

        // Save remaining items
        if (currentBatch.length > 0) {
            await this.contentRepository.save(currentBatch);
            generatedCount += currentBatch.length;
        }

        return { generatedCount };
    }

    private extractColumnsFromTemplate(template: string, availableColumns: string[]): string[] {
        const extractedColumns: string[] = [];

        // Match both:
        // 1. {{columnName}} - simple variable names (no spaces)
        // 2. {{[Column With Spaces]}} - bracket notation for names with spaces
        const simpleRegex = /\{\{(\w+)\}\}/g;
        const bracketRegex = /\{\{\[([^\]]+)\]\}\}/g;

        let match;

        // First, extract simple variable names
        while ((match = simpleRegex.exec(template)) !== null) {
            const columnName = match[1];
            if (availableColumns.includes(columnName) && !extractedColumns.includes(columnName)) {
                extractedColumns.push(columnName);
            }
        }

        // Then, extract bracket notation variables (for names with spaces)
        while ((match = bracketRegex.exec(template)) !== null) {
            const columnName = match[1];
            if (availableColumns.includes(columnName) && !extractedColumns.includes(columnName)) {
                extractedColumns.push(columnName);
            }
        }

        return extractedColumns;
    }

    async getGeneratedContents(
        projectId: string,
        page: number = 1,
        limit: number = 20,
        status?: PublishStatus,
    ): Promise<{ contents: GeneratedContent[]; total: number; page: number; totalPages: number }> {
        const where: any = { projectId };
        if (status) {
            where.publishStatus = status;
        }

        const [contents, total] = await this.contentRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return {
            contents,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getContentById(id: string): Promise<GeneratedContent | null> {
        return await this.contentRepository.findOne({ where: { id } });
    }

    async updateContent(id: string, updates: Partial<GeneratedContent>): Promise<GeneratedContent> {
        const content = await this.contentRepository.findOne({ where: { id } });
        if (!content) {
            throw new Error('Content not found');
        }

        Object.assign(content, updates);
        return await this.contentRepository.save(content);
    }

    async deleteContent(id: string): Promise<void> {
        await this.contentRepository.delete(id);
    }

    async startPublishJob(projectId: string, delaySeconds?: number): Promise<{ jobId: string }> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new Error('Project not found');
        }

        const delay = delaySeconds ?? project.publishDelaySeconds;

        const job = await this.publishQueue.add('publish-content', {
            projectId,
            delaySeconds: delay,
        });

        return { jobId: job.id.toString() };
    }

    async startPublishJobAsync(projectId: string, delaySeconds?: number): Promise<{ jobId: string }> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new Error('Project not found');
        }

        const delay = delaySeconds ?? project.publishDelaySeconds ?? 0;

        const publishJob = this.publishJobRepository.create({
            projectId,
            status: JobStatus.PENDING,
            totalContents: 0,
            processedCount: 0,
            delaySeconds: delay,
        });

        const savedJob = await this.publishJobRepository.save(publishJob);

        return { jobId: savedJob.id };
    }

    async publishContentSync(projectId: string, delaySeconds?: number): Promise<{ published: number }> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new Error('Project not found');
        }

        const delay = delaySeconds ?? project.publishDelaySeconds ?? 0;

        const contents = await this.contentRepository.find({
            where: { projectId, publishStatus: PublishStatus.PENDING },
        });

        let publishedCount = 0;

        for (const content of contents) {
            if (publishedCount > 0 && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

            content.publishStatus = PublishStatus.PUBLISHED;
            content.publishedAt = new Date();
            await this.contentRepository.save(content);

            publishedCount++;
        }

        return { published: publishedCount };
    }

    async unpublishContent(contentIds: string[]): Promise<{ unpublished: number }> {
        let unpublishedCount = 0;

        for (const id of contentIds) {
            const content = await this.contentRepository.findOne({ where: { id } });
            if (content && content.publishStatus === PublishStatus.PUBLISHED) {
                content.publishStatus = PublishStatus.PENDING;
                (content as any).publishedAt = null;
                await this.contentRepository.save(content);
                unpublishedCount++;
            }
        }

        return { unpublished: unpublishedCount };
    }

    async getPublishJobStatus(jobId: string): Promise<PublishJob> {
        const job = await this.publishJobRepository.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        return job;
    }

    async pausePublishJob(jobId: string): Promise<PublishJob> {
        const job = await this.publishJobRepository.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status !== JobStatus.PROCESSING && job.status !== JobStatus.PENDING) {
            throw new Error('Can only pause pending or processing jobs');
        }
        job.status = JobStatus.PAUSED;
        return await this.publishJobRepository.save(job);
    }

    async resumePublishJob(jobId: string): Promise<PublishJob> {
        const job = await this.publishJobRepository.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status !== JobStatus.PAUSED) {
            throw new Error('Can only resume paused jobs');
        }
        job.status = JobStatus.PENDING;
        return await this.publishJobRepository.save(job);
    }

    async cancelPublishJob(jobId: string): Promise<PublishJob> {
        const job = await this.publishJobRepository.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        if (job.status === JobStatus.COMPLETED) {
            throw new Error('Cannot cancel completed job');
        }
        job.status = JobStatus.CANCELLED;
        return await this.publishJobRepository.save(job);
    }

    async getActivePublishJob(projectId: string): Promise<PublishJob | null> {
        const job = await this.publishJobRepository.findOne({
            where: [
                { projectId, status: JobStatus.PENDING },
                { projectId, status: JobStatus.PROCESSING },
                { projectId, status: JobStatus.PAUSED },
            ],
            order: { createdAt: 'DESC' },
        });
        return job;
    }

    async getOverallStats(organizationId?: string): Promise<{
        totalProjects: number;
        totalContent: number;
        publishedContent: number;
        pendingContent: number;
        failedContent: number;
        activeJobs: number;
        completedJobsToday: number;
    }> {
        if (organizationId) {
            // Get projects for this organization
            const projects = await this.projectRepository.find({
                where: { organizationId },
                select: ['id']
            });

            const projectIds = projects.map(p => p.id);

            if (projectIds.length === 0) {
                return {
                    totalProjects: 0,
                    totalContent: 0,
                    publishedContent: 0,
                    pendingContent: 0,
                    failedContent: 0,
                    activeJobs: 0,
                    completedJobsToday: 0,
                };
            }

            const totalProjects = projects.length;
            const totalContent = await this.contentRepository.count({
                where: { projectId: In(projectIds) }
            });
            const publishedContent = await this.contentRepository.count({
                where: { projectId: In(projectIds), publishStatus: PublishStatus.PUBLISHED },
            });
            const pendingContent = await this.contentRepository.count({
                where: { projectId: In(projectIds), publishStatus: PublishStatus.PENDING },
            });
            const failedContent = await this.contentRepository.count({
                where: { projectId: In(projectIds), publishStatus: PublishStatus.FAILED },
            });

            const activeJobs = await this.publishJobRepository.count({
                where: [
                    { projectId: In(projectIds), status: JobStatus.PENDING },
                    { projectId: In(projectIds), status: JobStatus.PROCESSING },
                    { projectId: In(projectIds), status: JobStatus.PAUSED },
                ]
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const completedJobsToday = await this.publishJobRepository.count({
                where: {
                    projectId: In(projectIds),
                    status: JobStatus.COMPLETED,
                    completedAt: MoreThanOrEqual(today),
                },
            });

            return {
                totalProjects,
                totalContent,
                publishedContent,
                pendingContent,
                failedContent,
                activeJobs,
                completedJobsToday,
            };
        }

        // No organization filter
        const totalProjects = await this.projectRepository.count();
        const totalContent = await this.contentRepository.count();
        const publishedContent = await this.contentRepository.count({
            where: { publishStatus: PublishStatus.PUBLISHED },
        });
        const pendingContent = await this.contentRepository.count({
            where: { publishStatus: PublishStatus.PENDING },
        });
        const failedContent = await this.contentRepository.count({
            where: { publishStatus: PublishStatus.FAILED },
        });

        const activeJobs = await this.publishJobRepository.count({
            where: [
                { status: JobStatus.PENDING },
                { status: JobStatus.PROCESSING },
                { status: JobStatus.PAUSED },
            ],
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedJobsToday = await this.publishJobRepository.count({
            where: {
                status: JobStatus.COMPLETED,
                completedAt: MoreThanOrEqual(today),
            },
        });

        return {
            totalProjects,
            totalContent,
            publishedContent,
            pendingContent,
            failedContent,
            activeJobs,
            completedJobsToday,
        };
    }

    private generateDefaultTitle(data: Record<string, string>): string {
        const firstValue = Object.values(data)[0];
        return firstValue || 'Untitled';
    }

    private generateSlug(title: string, suffix: string): string {
        const slugified = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (suffix) {
            return `${slugified}-${suffix}`;
        }
        return slugified;
    }

    /**
     * Find contents by project for public API (with pagination)
     */
    async findContentsByProject(
        projectId: string,
        status?: string,
        skip: number = 0,
        take: number = 50,
    ): Promise<[GeneratedContent[], number]> {
        const where: any = { projectId };

        if (status) {
            where.publishStatus = status as PublishStatus;
        }

        return await this.contentRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take,
        });
    }

    /**
     * Find one content for public API
     */
    async findOnePublic(id: string): Promise<GeneratedContent> {
        const content = await this.contentRepository.findOne({ where: { id } });

        if (!content) {
            throw new Error('Content not found');
        }

        return content;
    }
}
