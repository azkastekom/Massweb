import { IsEmail, IsString, IsEnum } from 'class-validator';
import { OrganizationRole } from '../../entities/organization-member.entity';

export class AddOrgMemberDto {
    @IsEmail()
    email: string;

    @IsEnum(OrganizationRole)
    role: OrganizationRole;
}
