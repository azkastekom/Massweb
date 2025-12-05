import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
            },
            endpoint: endpoint || undefined, // Support for AWS-compatible S3 (MinIO, Wasabi, etc.)
            forcePathStyle: !!endpoint, // Required for MinIO and other S3-compatible services
        });
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'massweb-uploads';
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);

        // Generate URL based on endpoint configuration
        const endpoint = this.configService.get('AWS_S3_ENDPOINT');
        if (endpoint) {
            // For custom S3-compatible services (MinIO, etc.)
            return `${endpoint}/${this.bucketName}/${key}`;
        } else {
            // For AWS S3
            return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        const key = this.extractKeyFromUrl(fileUrl);

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);
    }

    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn });
    }

    private extractKeyFromUrl(url: string): string {
        const urlParts = url.split('.com/');
        return urlParts[1];
    }
}
