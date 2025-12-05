import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    organizationId: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    template: string;

    @IsString()
    @IsOptional()
    titleTemplate?: string;

    @IsString()
    @IsOptional()
    metaDescriptionTemplate?: string;

    @IsString()
    @IsOptional()
    tagsTemplate?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    publishDelaySeconds?: number = 5;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];
}
