import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly s3Service: S3Service) { }

    @Post('thumbnail')
    @UseInterceptors(FileInterceptor('file'))
    async uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('File must be an image (JPEG, PNG, GIF, or WEBP)');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must not exceed 5MB');
        }

        const url = await this.s3Service.uploadFile(file, 'thumbnails');
        return { url };
    }

    @Post('csv')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
            throw new BadRequestException('File must be a CSV');
        }

        // For CSV, we just return the file buffer for processing
        // The actual parsing will be handled by the CSV service
        return {
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
}
