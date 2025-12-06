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
            relations: ['csvRows'],
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const job = await this.generationQueue.add('generate-content', {
            projectId,
            totalRows: project.csvRows.length,
        });

        return {
            jobId: job.id.toString(),
            totalRows: project.csvRows.length,
        };
    }

    async generateContentSync(projectId: string): Promise<GeneratedContent[]> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['csvRows'],
        });

        if (!project) {
            throw new Error('Project not found');
        }

        await this.contentRepository.delete({ projectId });

        if (!project.csvRows || project.csvRows.length === 0) {
            throw new Error('No CSV data found');
        }

        const generatedContents: GeneratedContent[] = [];
        const firstRow = project.csvRows[0].rowData;
        const allColumnNames = Object.keys(firstRow);

        let columnsToUse: string[];
        if (project.titleTemplate) {
            columnsToUse = this.extractColumnsFromTemplate(project.titleTemplate, allColumnNames);
        } else {
            columnsToUse = allColumnNames;
        }

        const columnValues: Record<string, string[]> = {};
        for (const columnName of columnsToUse) {
            const uniqueValues = new Set<string>();
            for (const row of project.csvRows) {
                const value = row.rowData[columnName];
                if (value && value.trim()) {
                    uniqueValues.add(value.trim());
                }
            }
            columnValues[columnName] = Array.from(uniqueValues);
        }

        const combinations = this.generateCombinations(columnValues, columnsToUse);

        const enrichedCombinations = combinations.map(combo => {
            const enriched = { ...combo };
            for (const columnName of allColumnNames) {
                if (!columnsToUse.includes(columnName)) {
                    const firstValue = project.csvRows.find(row => row.rowData[columnName])?.rowData[columnName] || '';
                    enriched[columnName] = firstValue;
                }
            }
            return enriched;
        });

        const contentTemplate = Handlebars.compile(project.template);
        const titleTemplate = project.titleTemplate ? Handlebars.compile(project.titleTemplate) : null;
        const metaDescriptionTemplate = project.metaDescriptionTemplate
            ? Handlebars.compile(project.metaDescriptionTemplate)
            : null;
        const tagsTemplate = project.tagsTemplate ? Handlebars.compile(project.tagsTemplate) : null;

        const usedSlugs = new Set<string>();

        for (const data of enrichedCombinations) {
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
                publishStatus: PublishStatus.PENDING,
            });

            const saved = await this.contentRepository.save(generatedContent);
            generatedContents.push(saved);
        }

        return generatedContents;
    }

    private generateCombinations(
        columnValues: Record<string, string[]>,
        columnNames: string[],
    ): Record<string, string>[] {
        if (columnNames.length === 0) {
            return [{}];
        }

        const results: Record<string, string>[] = [];

        const generate = (index: number, current: Record<string, string>) => {
            if (index === columnNames.length) {
                results.push({ ...current });
                return;
            }

            const columnName = columnNames[index];
            const values = columnValues[columnName] || [];

            for (const value of values) {
                generate(index + 1, { ...current, [columnName]: value });
            }
        };

        generate(0, {});
        return results;
    }

    private extractColumnsFromTemplate(template: string, availableColumns: string[]): string[] {
        const extractedColumns: string[] = [];
        const regex = /\{\{(\w+)\}\}/g;
        let match;

        while ((match = regex.exec(template)) !== null) {
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
