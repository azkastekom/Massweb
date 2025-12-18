import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { CsvColumn } from '../entities/csv-column.entity';
import { CsvRow } from '../entities/csv-row.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { GeneratedContent } from '../entities/generated-content.entity';
import { Category } from '../entities/category.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, CsvColumn, CsvRow, OrganizationMember, GeneratedContent, Category]),
        UploadModule,
    ],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule { }

