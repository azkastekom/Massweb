import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ActiveUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        // Super admins bypass the active check
        if (user.isSuperAdmin) {
            return true;
        }

        // Check if user is active
        if (!user.isActive) {
            throw new ForbiddenException('Your account has been deactivated. Please contact support.');
        }

        return true;
    }
}
