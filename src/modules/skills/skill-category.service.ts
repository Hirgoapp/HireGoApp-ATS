import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillCategory } from './entities/skill-category.entity';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
import { FilterSkillCategoryDto } from './dto/filter-skill-category.dto';

@Injectable()
export class SkillCategoryService {
    constructor(
        @InjectRepository(SkillCategory)
        private readonly categoryRepo: Repository<SkillCategory>,
    ) { }

    async create(dto: CreateSkillCategoryDto, companyId: string, userId: string): Promise<SkillCategory> {
        const category = this.categoryRepo.create({
            ...dto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });
        return await this.categoryRepo.save(category);
    }

    async findAll(companyId: string, filter: FilterSkillCategoryDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.categoryRepo.createQueryBuilder('category').where('category.company_id = :companyId', { companyId }).andWhere('category.deleted_at IS NULL');

        if (rest.name) qb.andWhere('category.name ILIKE :name', { name: `%${rest.name}%` });
        if (rest.is_active !== undefined) qb.andWhere('category.is_active = :is_active', { is_active: rest.is_active });

        const total = await qb.getCount();
        const data = await qb.orderBy(`category.${sortBy}`, sortOrder).skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<SkillCategory> {
        const category = await this.categoryRepo.findOne({ where: { id, company_id: companyId, deleted_at: null } });
        if (!category) throw new NotFoundException(`Skill category ${id} not found`);
        return category;
    }

    async update(id: string, dto: UpdateSkillCategoryDto, companyId: string, userId: string): Promise<SkillCategory> {
        const category = await this.findOne(id, companyId);
        Object.assign(category, dto);
        category.updated_by = userId;
        return await this.categoryRepo.save(category);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.categoryRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.categoryRepo.delete(id);
    }

    async findActive(companyId: string): Promise<SkillCategory[]> {
        return await this.categoryRepo.find({ where: { company_id: companyId, is_active: true, deleted_at: null }, order: { name: 'ASC' } });
    }
}
