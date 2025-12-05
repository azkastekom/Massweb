import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { AdminJobsService } from './admin-jobs.service';
import { JobStatus } from '../../entities/publish-job.entity';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminJobsController {
    constructor(private readonly adminJobsService: AdminJobsService) { }

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('status') status?: JobStatus,
        @Query('projectId') projectId?: string,
    ) {
        return await this.adminJobsService.findAll(
            page || 1,
            limit || 20,
            status,
            projectId,
        );
    }

    @Get(':id')
    async getJobDetails(@Param('id') id: string) {
        return await this.adminJobsService.getJobDetails(id);
    }

    @Post(':id/pause')
    async pauseJob(@Param('id') id: string) {
        return await this.adminJobsService.pauseJob(id);
    }

    @Post(':id/resume')
    async resumeJob(@Param('id') id: string) {
        return await this.adminJobsService.resumeJob(id);
    }

    @Post(':id/cancel')
    async cancelJob(@Param('id') id: string) {
        return await this.adminJobsService.cancelJob(id);
    }

    @Delete(':id')
    async deleteJob(@Param('id') id: string) {
        return await this.adminJobsService.deleteJob(id);
    }
}
