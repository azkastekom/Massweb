import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
    constructor(
        @InjectRepository(ApiKey)
        private apiKeyRepository: Repository<ApiKey>,
    ) { }

    /**
     * Generate a new API key (64 character hex string)
     */
    generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash an API key using SHA256
     */
    hashKey(key: string): string {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Create a new API key for an organization
     */
    async createApiKey(
        organizationId: string,
        userId: string,
        name: string,
        expiresAt?: Date,
    ): Promise<{ apiKey: ApiKey; plainKey: string }> {
        const plainKey = this.generateKey();
        const hashedKey = this.hashKey(plainKey);

        const apiKey = this.apiKeyRepository.create({
            key: hashedKey,
            name,
            organizationId,
            createdById: userId,
            isActive: true,
            expiresAt: expiresAt || null,
        });

        await this.apiKeyRepository.save(apiKey);

        return { apiKey, plainKey };
    }

    /**
     * Validate an API key and return the associated organization
     */
    async validateKey(plainKey: string): Promise<ApiKey | null> {
        const hashedKey = this.hashKey(plainKey);

        const apiKey = await this.apiKeyRepository.findOne({
            where: { key: hashedKey, isActive: true },
            relations: ['organization'],
        });

        if (!apiKey) {
            return null;
        }

        // Check if key is expired
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            return null;
        }

        return apiKey;
    }

    /**
     * Update last used timestamp
     */
    async updateLastUsed(id: string): Promise<void> {
        await this.apiKeyRepository.update(id, { lastUsedAt: new Date() });
    }

    /**
     * List all API keys for an organization
     */
    async listKeys(organizationId: string): Promise<ApiKey[]> {
        return this.apiKeyRepository.find({
            where: { organizationId },
            relations: ['createdBy'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Revoke an API key (soft delete)
     */
    async revokeKey(id: string, organizationId: string): Promise<ApiKey> {
        const apiKey = await this.apiKeyRepository.findOne({
            where: { id, organizationId },
        });

        if (!apiKey) {
            throw new NotFoundException('API key not found');
        }

        apiKey.isActive = false;
        return this.apiKeyRepository.save(apiKey);
    }

    /**
     * Delete an API key permanently
     */
    async deleteKey(id: string, organizationId: string): Promise<void> {
        const result = await this.apiKeyRepository.delete({ id, organizationId });

        if (result.affected === 0) {
            throw new NotFoundException('API key not found');
        }
    }

    /**
     * Get a single API key
     */
    async getKey(id: string, organizationId: string): Promise<ApiKey> {
        const apiKey = await this.apiKeyRepository.findOne({
            where: { id, organizationId },
            relations: ['createdBy'],
        });

        if (!apiKey) {
            throw new NotFoundException('API key not found');
        }

        return apiKey;
    }

    /**
     * Refresh an API key (regenerate the key value while keeping metadata)
     */
    async refreshKey(id: string, organizationId: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
        const apiKey = await this.apiKeyRepository.findOne({
            where: { id, organizationId },
        });

        if (!apiKey) {
            throw new NotFoundException('API key not found');
        }

        // Generate new key
        const plainKey = this.generateKey();
        const hashedKey = this.hashKey(plainKey);

        // Update the key but keep all other metadata
        apiKey.key = hashedKey;
        apiKey.isActive = true; // Reactivate if it was revoked
        apiKey.lastUsedAt = null; // Reset last used

        await this.apiKeyRepository.save(apiKey);

        return { apiKey, plainKey };
    }
}
