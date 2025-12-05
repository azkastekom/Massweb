import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { Project } from '../entities/project.entity';
import { PublishJob } from '../entities/publish-job.entity';
import { GeneratedContent } from '../entities/generated-content.entity';
import { AdminOrganizationsController } from './organizations/admin-organizations.controller';
import { AdminOrganizationsService } from './organizations/admin-organizations.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminJobsController } from './jobs/admin-jobs.controller';
import { AdminJobsService } from './jobs/admin-jobs.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Organization,
            OrganizationMember,
            Project,
            PublishJob,
            GeneratedContent,
        ]),
    ],
    controllers: [
        AdminOrganizationsController,
        AdminUsersController,
        AdminJobsController,
    ],
    providers: [
        AdminOrganizationsService,
        AdminUsersService,
        AdminJobsService,
    ],
})
export class AdminModule { }
