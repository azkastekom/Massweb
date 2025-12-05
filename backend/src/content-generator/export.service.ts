import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedContent } from '../entities/generated-content.entity';
import archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class ExportService {
    constructor(
        @InjectRepository(GeneratedContent)
        private contentRepository: Repository<GeneratedContent>,
    ) { }

    async exportAsCSV(projectId: string): Promise<string> {
        const contents = await this.contentRepository.find({
            where: { projectId },
            order: { createdAt: 'ASC' },
        });

        if (contents.length === 0) {
            return 'title,slug,content,metaDescription,tags,publishStatus,createdAt,publishedAt\n';
        }

        // CSV Header
        const header = 'title,slug,content,metaDescription,tags,publishStatus,createdAt,publishedAt\n';

        // CSV Rows
        const rows = contents.map(content => {
            return [
                this.escapeCsvField(content.title),
                this.escapeCsvField(content.slug),
                this.escapeCsvField(content.content),
                this.escapeCsvField(content.metaDescription || ''),
                this.escapeCsvField(content.tags || ''),
                content.publishStatus,
                content.createdAt.toISOString(),
                content.publishedAt ? content.publishedAt.toISOString() : '',
            ].join(',');
        });

        return header + rows.join('\n');
    }

    async exportAsJSON(projectId: string): Promise<GeneratedContent[]> {
        return await this.contentRepository.find({
            where: { projectId },
            order: { createdAt: 'ASC' },
        });
    }

    async exportAsHTMLZip(projectId: string): Promise<Buffer> {
        const contents = await this.contentRepository.find({
            where: { projectId },
            order: { createdAt: 'ASC' },
        });

        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            const chunks: Buffer[] = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', (err) => reject(err));

            // Add index file
            const indexHtml = this.generateIndexHtml(contents);
            archive.append(indexHtml, { name: 'index.html' });

            // Add individual content files
            contents.forEach((content, index) => {
                const filename = `${content.slug || `content-${index + 1}`}.html`;
                const html = this.generateCompleteHtml(content);
                archive.append(html, { name: filename });
            });

            archive.finalize();
        });
    }

    private escapeCsvField(field: string): string {
        if (!field) return '""';

        // Escape quotes by doubling them
        const escaped = field.replace(/"/g, '""');

        // Wrap in quotes if contains comma, newline, or quote
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
            return `"${escaped}"`;
        }

        return `"${escaped}"`;
    }

    private generateIndexHtml(contents: GeneratedContent[]): string {
        const links = contents
            .map((content, index) => {
                const filename = `${content.slug || `content-${index + 1}`}.html`;
                return `<li><a href="${filename}">${content.title}</a></li>`;
            })
            .join('\n        ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Export Index</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        h1 {
            color: #333;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        a {
            text-decoration: none;
            color: #0066cc;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Content Export Index</h1>
    <p>Total files: ${contents.length}</p>
    <ul>
        ${links}
    </ul>
</body>
</html>`;
    }

    private generateCompleteHtml(content: GeneratedContent): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content.title)}</title>
    <meta name="description" content="${this.escapeHtml(content.metaDescription || '')}">
    ${content.tags ? `<meta name="keywords" content="${this.escapeHtml(content.tags)}">` : ''}
</head>
<body>
${content.content}
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
