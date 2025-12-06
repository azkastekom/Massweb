import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Post()
    async create(@Body() body: { name: string; organizationId: string; expiryDays?: number }, @Request() req) {
        let expiresAt: Date | undefined;

        if (body.expiryDays && body.expiryDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + body.expiryDays);
        }

        const { apiKey, plainKey } = await this.apiKeysService.createApiKey(
            body.organizationId,
            req.user.id,
            body.name,
            expiresAt,
        );

        return {
            ...apiKey,
            plainKey, // Return plain key ONLY on creation
        };
    }

    @Get('organization/:organizationId')
    async listByOrganization(@Param('organizationId') organizationId: string) {
        const keys = await this.apiKeysService.listKeys(organizationId);

        // Never return the hashed key
        return keys.map(key => ({
            id: key.id,
            name: key.name,
            isActive: key.isActive,
            lastUsedAt: key.lastUsedAt,
            expiresAt: key.expiresAt,
            createdAt: key.createdAt,
            createdBy: key.createdBy,
        }));
    }

    @Patch(':id/revoke')
    async revoke(@Param('id') id: string, @Body() body: { organizationId: string }) {
        return this.apiKeysService.revokeKey(id, body.organizationId);
    }

    @Patch(':id/refresh')
    async refresh(@Param('id') id: string, @Body() body: { organizationId: string }) {
        const { apiKey, plainKey } = await this.apiKeysService.refreshKey(id, body.organizationId);

        return {
            ...apiKey,
            plainKey, // Return plain key ONLY on refresh
        };
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Body() body: { organizationId: string }) {
        await this.apiKeysService.deleteKey(id, body.organizationId);
        return { message: 'API key deleted successfully' };
    }
}
