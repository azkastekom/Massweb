import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import type { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './organizations.service';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationRole } from '../entities/organization-member.entity';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    @Post()
    async create(@Request() req, @Body() createDto: CreateOrganizationDto) {
        return await this.organizationsService.create(req.user.id, createDto);
    }

    @Get()
    async findAll(@Request() req) {
        return await this.organizationsService.findAllForUser(req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.organizationsService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req,
        @Body() updateDto: UpdateOrganizationDto,
    ) {
        return await this.organizationsService.update(id, req.user.id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        await this.organizationsService.remove(id, req.user.id);
        return { message: 'Organization deleted successfully' };
    }

    @Post(':id/members')
    async addMember(
        @Param('id') id: string,
        @Request() req,
        @Body() addMemberDto: AddMemberDto,
    ) {
        return await this.organizationsService.addMember(id, req.user.id, addMemberDto);
    }

    @Delete(':id/members/:userId')
    async removeMember(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        await this.organizationsService.removeMember(id, req.user.id, userId);
        return { message: 'Member removed successfully' };
    }

    @Patch(':id/members/:userId')
    async updateMemberRole(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Request() req,
        @Body() body: { role: OrganizationRole },
    ) {
        return await this.organizationsService.updateMemberRole(
            id,
            req.user.id,
            userId,
            body.role,
        );
    }

    @Get(':id/members')
    async getMembers(@Param('id') id: string) {
        return await this.organizationsService.getMembers(id);
    }

    @Post(':id/leave')
    async leaveOrganization(@Param('id') id: string, @Request() req) {
        await this.organizationsService.removeMember(id, req.user.id, req.user.id);
        return { message: 'Left organization successfully' };
    }
}
