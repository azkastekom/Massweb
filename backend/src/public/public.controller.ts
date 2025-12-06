import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Request } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ContentGeneratorService } from '../content-generator/content-generator.service';

@Controller('public')
export class PublicController {
    constructor(private readonly contentGeneratorService: ContentGeneratorService) { }

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
