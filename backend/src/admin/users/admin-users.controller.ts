import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    ParseBoolPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) { }

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('search') search?: string,
        @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
        @Query('isSuperAdmin', new ParseBoolPipe({ optional: true })) isSuperAdmin?: boolean,
    ) {
        return await this.adminUsersService.findAll(
            page || 1,
            limit || 20,
            search,
            isActive,
            isSuperAdmin,
        );
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.adminUsersService.create(createUserDto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
        return await this.adminUsersService.update(id, updateDto);
    }

    @Get(':id/organizations')
    async getUserOrganizations(@Param('id') id: string) {
        return await this.adminUsersService.getUserOrganizations(id);
    }

    @Post(':id/organizations/:orgId')
    async addToOrganization(
        @Param('id') userId: string,
        @Param('orgId') organizationId: string,
        @Body('role') role: string,
    ) {
        return await this.adminUsersService.addUserToOrganization(userId, organizationId, role);
    }

    @Delete(':id/organizations/:orgId')
    async removeFromOrganization(
        @Param('id') userId: string,
        @Param('orgId') organizationId: string,
    ) {
        return await this.adminUsersService.removeUserFromOrganization(userId, organizationId);
    }
}
