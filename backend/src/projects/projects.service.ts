import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(OrganizationMember)
        private orgMemberRepository: Repository<OrganizationMember>,
    ) { }

    async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
        // Verify user is member of the organization
        await this.checkOrgMembership(createProjectDto.organizationId, userId);

        const project = this.projectRepository.create({
            ...createProjectDto,
            createdById: userId,
        });
        return await this.projectRepository.save(project);
    }

    async findAll(userId: string, organizationId?: string): Promise<Project[]> {
        // Get all organizations user belongs to
        const memberships = await this.orgMemberRepository.find({
            where: { userId },
        });

        const organizationIds = memberships.map(m => m.organizationId);

        if (organizationIds.length === 0) {
            return [];
        }

        const query = this.projectRepository
            .createQueryBuilder('project')
            .where('project.organizationId IN (:...organizationIds)', { organizationIds })
            .leftJoinAndSelect('project.csvColumns', 'csvColumns')
            .leftJoinAndSelect('project.csvRows', 'csvRows')
            .orderBy('project.createdAt', 'DESC');

        // If organizationId is provided, filter by it
        if (organizationId) {
            query.andWhere('project.organizationId = :organizationId', { organizationId });
        }

        return await query.getMany();
    }

    async findOne(id: string, userId: string): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id },
            relations: ['csvColumns', 'csvRows', 'generatedContents', 'publishJobs', 'organization'],
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        // Verify user has access to this project's organization
        await this.checkOrgMembership(project.organizationId, userId);

        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
        const project = await this.findOne(id, userId);
        Object.assign(project, updateProjectDto);
        return await this.projectRepository.save(project);
    }

    async remove(id: string, userId: string): Promise<void> {
        const project = await this.findOne(id, userId);
        await this.projectRepository.remove(project);
    }

    async getProjectStats(id: string, userId: string): Promise<{
        totalContents: number;
        publishedContents: number;
        pendingContents: number;
    }> {
        const project = await this.findOne(id, userId);
        const totalContents = project.generatedContents?.length || 0;
        const publishedContents = project.generatedContents?.filter(c => c.publishStatus === 'published').length || 0;
        const pendingContents = totalContents - publishedContents;

        return {
            totalContents,
            publishedContents,
            pendingContents,
        };
    }

    private async checkOrgMembership(organizationId: string, userId: string): Promise<void> {
        const membership = await this.orgMemberRepository.findOne({
            where: {
                organizationId,
                userId,
            },
        });

        if (!membership) {
            throw new ForbiddenException('You do not have access to this organization');
        }
    }
}
