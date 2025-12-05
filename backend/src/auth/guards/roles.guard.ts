import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => {
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
        const roles_key = 'roles';
        if (descriptor) {
            Reflect.defineMetadata(roles_key, roles, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(roles_key, roles, target);
        return target;
    };
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        // SuperAdmin has access to everything
        if (user.isSuperAdmin) {
            return true;
        }

        // Check if user has required role
        return roles.some((role) => role === 'user');
    }
}
