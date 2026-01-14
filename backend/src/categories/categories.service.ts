import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { OrganizationMember } from '../entities/organization-member.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(OrganizationMember)
        private orgMemberRepository: Repository<OrganizationMember>,
    ) { }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private async checkOrgMembership(organizationId: string, userId: string): Promise<void> {
        const membership = await this.orgMemberRepository.findOne({
            where: { organizationId, userId },
        });

        if (!membership) {
            throw new ForbiddenException('You do not have access to this organization');
        }
    }

    async create(
        organizationId: string,
        userId: string,
        data: { name: string; description?: string; color?: string },
    ): Promise<Category> {
        await this.checkOrgMembership(organizationId, userId);

        const category = this.categoryRepository.create({
            ...data,
            organizationId,
            slug: this.generateSlug(data.name),
        });

        return await this.categoryRepository.save(category);
    }

    async findAll(organizationId: string, userId: string): Promise<Category[]> {
        await this.checkOrgMembership(organizationId, userId);

        return await this.categoryRepository.find({
            where: { organizationId },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, userId: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        await this.checkOrgMembership(category.organizationId, userId);

        return category;
    }

    async update(
        id: string,
        userId: string,
        data: { name?: string; description?: string; color?: string },
    ): Promise<Category> {
        const category = await this.findOne(id, userId);

        if (data.name) {
            category.name = data.name;
            category.slug = this.generateSlug(data.name);
        }
        if (data.description !== undefined) {
            category.description = data.description;
        }
        if (data.color !== undefined) {
            category.color = data.color;
        }

        return await this.categoryRepository.save(category);
    }

    async remove(id: string, userId: string): Promise<void> {
        const category = await this.findOne(id, userId);
        await this.categoryRepository.remove(category);
    }

    /**
     * Find categories by IDs (for project creation)
     */
    async findByIds(ids: string[], organizationId: string): Promise<Category[]> {
        if (ids.length === 0) return [];

        return await this.categoryRepository
            .createQueryBuilder('category')
            .where('category.id IN (:...ids)', { ids })
            .andWhere('category.organizationId = :organizationId', { organizationId })
            .getMany();
    }

    /**
     * Find all categories for an organization (for public API - no auth check)
     */
    async findByOrganization(organizationId: string): Promise<Category[]> {
        return await this.categoryRepository.find({
            where: { organizationId },
            order: { name: 'ASC' },
        });
    }

    /**
     * Find category by slug and organization
     */
    async findBySlug(slug: string, organizationId: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { slug, organizationId },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }
}
