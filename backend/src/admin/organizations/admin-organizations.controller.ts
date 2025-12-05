import {
    Controller,
    Get,
    Patch,
    Post,
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
import { AdminOrganizationsService } from './admin-organizations.service';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { AddOrgMemberDto } from '../dto/add-org-member.dto';

@Controller('admin/organizations')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminOrganizationsController {
    constructor(private readonly adminOrganizationsService: AdminOrganizationsService) { }

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('search') search?: string,
        @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    ) {
        return await this.adminOrganizationsService.findAll(
            page || 1,
            limit || 20,
            search,
            isActive,
        );
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto) {
        return await this.adminOrganizationsService.update(id, updateDto);
    }

    @Get(':id/members')
    async getMembers(@Param('id') id: string) {
        return await this.adminOrganizationsService.getMembers(id);
    }

    @Post(':id/members')
    async addMember(@Param('id') id: string, @Body() addMemberDto: AddOrgMemberDto) {
        return await this.adminOrganizationsService.addMember(id, addMemberDto);
    }

    @Delete(':id/members/:userId')
    async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return await this.adminOrganizationsService.removeMember(id, userId);
    }
}
