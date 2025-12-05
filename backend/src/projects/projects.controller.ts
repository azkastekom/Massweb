import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ValidationPipe,
    UsePipes,
    UseGuards,
    Request,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly uploadService: UploadService,
    ) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
        return this.projectsService.create(createProjectDto, req.user.id);
    }

    @Get()
    findAll(@Request() req, @Query('organizationId') organizationId?: string) {
        return this.projectsService.findAll(req.user.id, organizationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.projectsService.findOne(id, req.user.id);
    }

    @Get(':id/stats')
    getStats(@Param('id') id: string, @Request() req) {
        return this.projectsService.getProjectStats(id, req.user.id);
    }

    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
        return this.projectsService.update(id, updateProjectDto, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.projectsService.remove(id, req.user.id);
    }

    @Post(':id/thumbnail')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async uploadThumbnail(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        const project = await this.projectsService.findOne(id, req.user.id);
        this.uploadService.validateImageFile(file);

        const thumbnailUrl = await this.uploadService.uploadThumbnail(
            file,
            project.id,
            project.organizationId,
        );

        return this.projectsService.update(id, { thumbnailUrl }, req.user.id);
    }

    @Delete(':id/thumbnail')
    async deleteThumbnail(@Param('id') id: string, @Request() req) {
        const project = await this.projectsService.findOne(id, req.user.id);

        if (project.thumbnailUrl) {
            await this.uploadService.deleteFile(project.thumbnailUrl);
        }

        return this.projectsService.update(id, { thumbnailUrl: undefined }, req.user.id);
    }
}
