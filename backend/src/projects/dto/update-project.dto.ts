import { IsString, IsOptional, IsInt, Min, IsArray, IsNumber } from 'class-validator';

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    template?: string;

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
    publishDelaySeconds?: number;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];
}
