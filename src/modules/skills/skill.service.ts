import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FilterSkillDto } from './dto/filter-skill.dto';

@Injectable()
export class SkillService {
    constructor(
        @InjectRepository(Skill)
        private readonly skillRepo: Repository<Skill>,
    ) { }

    async create(dto: CreateSkillDto, companyId: string, userId: string): Promise<Skill> {
        const skill = this.skillRepo.create({
            ...dto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });
        return await this.skillRepo.save(skill);
    }

    async findAll(companyId: string, filter: FilterSkillDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.skillRepo.createQueryBuilder('skill').where('skill.company_id = :companyId', { companyId }).andWhere('skill.deleted_at IS NULL');

        if (rest.name) qb.andWhere('skill.name ILIKE :name', { name: `%${rest.name}%` });
        if (rest.category_id) qb.andWhere('skill.category_id = :category_id', { category_id: rest.category_id });
        if (rest.is_active !== undefined) qb.andWhere('skill.is_active = :is_active', { is_active: rest.is_active });

        const total = await qb.getCount();
        const data = await qb.orderBy(`skill.${sortBy}`, sortOrder).skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Skill> {
        const skill = await this.skillRepo.findOne({ where: { id, company_id: companyId, deleted_at: null } });
        if (!skill) throw new NotFoundException(`Skill ${id} not found`);
        return skill;
    }

    async update(id: string, dto: UpdateSkillDto, companyId: string, userId: string): Promise<Skill> {
        const skill = await this.findOne(id, companyId);
        Object.assign(skill, dto);
        skill.updated_by = userId;
        return await this.skillRepo.save(skill);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.skillRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.skillRepo.delete(id);
    }

    async findActive(companyId: string): Promise<Skill[]> {
        return await this.skillRepo.find({ where: { company_id: companyId, is_active: true, deleted_at: null }, order: { name: 'ASC' } });
    }

    async findByCategory(categoryId: string, companyId: string): Promise<Skill[]> {
        return await this.skillRepo.find({
            where: { company_id: companyId, category_id: categoryId, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async search(companyId: string, term: string): Promise<Skill[]> {
        return await this.skillRepo
            .createQueryBuilder('skill')
            .where('skill.company_id = :companyId', { companyId })
            .andWhere('skill.deleted_at IS NULL')
            .andWhere('(skill.name ILIKE :term OR skill.description ILIKE :term)', { term: `%${term}%` })
            .orderBy('skill.name', 'ASC')
            .limit(10)
            .getMany();
    }
}
