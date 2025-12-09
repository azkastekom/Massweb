import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Request, ForbiddenException } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ContentGeneratorService } from '../content-generator/content-generator.service';

@Controller('public')
export class PublicController {
    constructor(private readonly contentGeneratorService: ContentGeneratorService) { }

    /**
     * Get all contents for an organization (optionally filtered by project)
     * Requires API key authentication
     */
    @Get('organizations/:organizationId/contents')
    @UseGuards(ApiKeyGuard)
    async getOrganizationContents(
        @Param('organizationId') organizationId: string,
        @Query('projectId') projectId?: string,
        @Query('status') status?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
        @Request() req?: any,
    ) {
        // Verify the API key belongs to this organization
        if (req.organizationId !== organizationId) {
            throw new ForbiddenException('API key does not have access to this organization');
        }

        // Limit max items per page
        const maxLimit = Math.min(limit, 100);
        const skip = (page - 1) * maxLimit;

        const [contents, total] = await this.contentGeneratorService.findContentsByOrganization(
            organizationId,
            projectId,
            status,
            skip,
            maxLimit,
        );

        return {
            data: contents,
            total,
            page,
            limit: maxLimit,
            totalPages: Math.ceil(total / maxLimit),
        };
    }

    /**
     * Get all projects for an organization
     * Requires API key authentication
     */
    @Get('organizations/:organizationId/projects')
    @UseGuards(ApiKeyGuard)
    async getOrganizationProjects(
        @Param('organizationId') organizationId: string,
        @Request() req?: any,
    ) {
        // Verify the API key belongs to this organization
        if (req.organizationId !== organizationId) {
            throw new ForbiddenException('API key does not have access to this organization');
        }

        const projects = await this.contentGeneratorService.findProjectsByOrganization(organizationId);

        // Return simplified project info
        return {
            data: projects.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                thumbnailUrl: p.thumbnailUrl,
                categories: p.categories,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })),
            total: projects.length,
        };
    }

    /**
     * Get all contents for a project
     * Requires API key authentication
     */
    @Get('projects/:projectId/contents')
    @UseGuards(ApiKeyGuard)
    async getProjectContents(
        @Param('projectId') projectId: string,
        @Query('status') status?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
        @Request() req?: any,
    ) {
        // Limit max items per page
        const maxLimit = Math.min(limit, 100);
        const skip = (page - 1) * maxLimit;

        const [contents, total] = await this.contentGeneratorService.findContentsByProject(
            projectId,
            status,
            skip,
            maxLimit,
        );

        return {
            data: contents,
            total,
            page,
            limit: maxLimit,
            totalPages: Math.ceil(total / maxLimit),
        };
    }

    /**
     * Get a single content item by ID
     * Requires API key authentication
     */
    @Get('contents/:contentId')
    @UseGuards(ApiKeyGuard)
    async getContent(
        @Param('contentId') contentId: string,
        @Request() req?: any,
    ) {
        return this.contentGeneratorService.findOnePublic(contentId);
    }
}

