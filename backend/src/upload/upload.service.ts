import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        const region = this.configService.get('AWS_REGION');
        const endpoint = this.configService.get('AWS_S3_ENDPOINT');

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
            ...(endpoint && {
                endpoint,
                forcePathStyle: true, // Use path-style URLs for S3-compatible services (endpoint.com/bucket/key)
            }),
        });

        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || '';
    }

    async uploadThumbnail(file: Express.Multer.File, projectId: string, organizationId: string): Promise<string> {
        // Validate S3 configuration
        if (!this.bucketName) {
            throw new BadRequestException('S3 bucket not configured. Please set AWS_S3_BUCKET_NAME in environment variables.');
        }

        const timestamp = Date.now();
        const fileExt = file.originalname.split('.').pop();
        const key = `thumbnails/${organizationId}/${projectId}-${timestamp}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // Make thumbnails publicly accessible
        });

        try {
            await this.s3Client.send(command);

            // Return the public URL
            const publicUrlPrefix = this.configService.get('AWS_S3_PUBLIC_URL_PREFIX');
            const endpoint = this.configService.get('AWS_S3_ENDPOINT');

            if (publicUrlPrefix) {
                // Use custom public URL prefix (for Contabo: https://endpoint/projectid:bucket)
                const cleanPrefix = publicUrlPrefix.replace(/\/$/, '');
                return `${cleanPrefix}/${key}`;
            }

            if (endpoint) {
                // Standard S3-compatible: endpoint/bucket/key
                const cleanEndpoint = endpoint.replace(/\/$/, '');
                return `${cleanEndpoint}/${this.bucketName}/${key}`;
            }

            // AWS S3: bucket.s3.region.amazonaws.com/key
            return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
        } catch (error: any) {
            console.error('S3 Upload Error:', error);

            // Provide specific error messages
            if (error.name === 'CredentialsProviderError' || error.message?.includes('credentials')) {
                throw new BadRequestException('S3 credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
            }

            if (error.name === 'NoSuchBucket') {
                throw new BadRequestException(`S3 bucket "${this.bucketName}" does not exist. Create it or update AWS_S3_BUCKET_NAME`);
            }

            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new BadRequestException('Cannot connect to S3. Check AWS_S3_ENDPOINT. For local testing, use MinIO');
            }

            if (error.name === 'AccessDenied') {
                throw new BadRequestException('Access denied to S3. Check IAM permissions');
            }

            throw new BadRequestException(`S3 upload failed: ${error.message}. Check backend/.env configuration`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract key from URL
            const key = this.extractKeyFromUrl(fileUrl);

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
        } catch (error) {
            console.error('Failed to delete file from S3:', error);
            // Don't throw error, just log it
        }
    }

    private extractKeyFromUrl(url: string): string {
        // Extract key from S3 URL
        const urlParts = url.split('/');
        const bucketIndex = urlParts.indexOf(this.bucketName);
        if (bucketIndex !== -1) {
            return urlParts.slice(bucketIndex + 1).join('/');
        }
        // Fallback: assume last parts are the key
        return urlParts.slice(-3).join('/');
    }

    validateImageFile(file: Express.Multer.File): void {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files (JPEG, PNG, GIF, WEBP) are allowed');
        }

        if (file.size > maxSize) {
            throw new BadRequestException('File size must not exceed 5MB');
        }
    }
}
