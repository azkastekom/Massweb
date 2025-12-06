import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private apiKeysService: ApiKeysService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        const validKey = await this.apiKeysService.validateKey(apiKey);

        if (!validKey) {
            throw new UnauthorizedException('Invalid or expired API key');
        }

        // Attach organization to request for use in controllers
        request.organization = validKey.organization;
        request.organizationId = validKey.organizationId;

        // Update last used timestamp asynchronously
        this.apiKeysService.updateLastUsed(validKey.id).catch(() => {
            // Ignore errors to avoid blocking the request
        });

        return true;
    }
}
