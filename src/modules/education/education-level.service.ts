import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationLevel } from './entities/education-level.entity';
import { CreateEducationLevelDto } from './dto/create-education-level.dto';
import { UpdateEducationLevelDto } from './dto/update-education-level.dto';
import { FilterEducationLevelDto } from './dto/filter-education-level.dto';

@Injectable()
export class EducationLevelService {
    constructor(
        @InjectRepository(EducationLevel)
        private readonly levelRepo: Repository<EducationLevel>,
    ) { }

    async create(dto: CreateEducationLevelDto, companyId: string, userId: string): Promise<EducationLevel> {
        const level = this.levelRepo.create({ ...dto, company_id: companyId, created_by: userId, updated_by: userId });
        return await this.levelRepo.save(level);
    }

    async findAll(companyId: string, filter: FilterEducationLevelDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.levelRepo.createQueryBuilder('level').where('level.company_id = :companyId', { companyId }).andWhere('level.deleted_at IS NULL');

        if (rest.name) qb.andWhere('level.name ILIKE :name', { name: `%${rest.name}%` });
        if (rest.is_active !== undefined) qb.andWhere('level.is_active = :is_active', { is_active: rest.is_active });

        const total = await qb.getCount();
        const data = await qb.orderBy(`level.${sortBy}`, sortOrder).skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<EducationLevel> {
        const level = await this.levelRepo.findOne({ where: { id, company_id: companyId, deleted_at: null } });
        if (!level) throw new NotFoundException(`Education level ${id} not found`);
        return level;
    }

    async update(id: string, dto: UpdateEducationLevelDto, companyId: string, userId: string): Promise<EducationLevel> {
        const level = await this.findOne(id, companyId);
        Object.assign(level, dto);
        level.updated_by = userId;
        return await this.levelRepo.save(level);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.levelRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.levelRepo.delete(id);
    }

    async findActive(companyId: string): Promise<EducationLevel[]> {
        return await this.levelRepo.find({ where: { company_id: companyId, is_active: true, deleted_at: null }, order: { name: 'ASC' } });
    }
}
