import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    async create(
        @Body() body: { organizationId: string; name: string; description?: string; color?: string },
        @Request() req,
    ) {
        return await this.categoriesService.create(
            body.organizationId,
            req.user.id,
            { name: body.name, description: body.description, color: body.color },
        );
    }

    @Get('organization/:organizationId')
    async findAll(@Param('organizationId') organizationId: string, @Request() req) {
        return await this.categoriesService.findAll(organizationId, req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        return await this.categoriesService.findOne(id, req.user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; color?: string },
        @Request() req,
    ) {
        return await this.categoriesService.update(id, req.user.id, body);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        await this.categoriesService.remove(id, req.user.id);
        return { message: 'Category deleted successfully' };
    }
}
