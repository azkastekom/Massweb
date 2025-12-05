import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateOrganizationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
