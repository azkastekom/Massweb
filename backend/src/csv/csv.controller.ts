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

        // Accept CSV and Excel files
        const allowedMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExtensions = ['.csv', '.xlsx', '.xls'];

        const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some(ext =>
            file.originalname.toLowerCase().endsWith(ext)
        );

        if (!hasValidMimeType && !hasValidExtension) {
            throw new BadRequestException('File must be a CSV or Excel file (.csv, .xlsx, .xls)');
        }

        return await this.csvService.parseAndSaveFile(projectId, file);
    }

    @Get('projects/:projectId')
    async getCsvData(@Param('projectId') projectId: string) {
        return await this.csvService.getCsvData(projectId);
    }
}
