import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvService } from './csv.service';

@Controller('csv')
export class CsvController {
    constructor(private readonly csvService: CsvService) { }

    @Post('projects/:projectId/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(
        @Param('projectId') projectId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
            throw new BadRequestException('File must be a CSV');
        }

        return await this.csvService.parseAndSaveCsv(projectId, file);
    }

    @Get('projects/:projectId')
    async getCsvData(@Param('projectId') projectId: string) {
        return await this.csvService.getCsvData(projectId);
    }
}
