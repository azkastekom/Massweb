import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { S3Module } from './s3/s3.module';
import { QueueModule } from './queue/queue.module';
import { ProjectsModule } from './projects/projects.module';
import { CsvModule } from './csv/csv.module';
import { UploadsModule } from './uploads/uploads.module';
import { ContentGeneratorModule } from './content-generator/content-generator.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    S3Module,
    QueueModule,
    ProjectsModule,
    CsvModule,
    UploadsModule,
    ContentGeneratorModule,
    AuthModule,
    OrganizationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
