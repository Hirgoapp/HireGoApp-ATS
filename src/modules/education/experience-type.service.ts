import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienceType } from './entities/experience-type.entity';
import { CreateExperienceTypeDto } from './dto/create-experience-type.dto';
import { UpdateExperienceTypeDto } from './dto/update-experience-type.dto';
import { FilterExperienceTypeDto } from './dto/filter-experience-type.dto';

@Injectable()
export class ExperienceTypeService {
    constructor(
        @InjectRepository(ExperienceType)
        private readonly typeRepo: Repository<ExperienceType>,
    ) { }

    async create(dto: CreateExperienceTypeDto, companyId: string, userId: string): Promise<ExperienceType> {
        const type = this.typeRepo.create({ ...dto, company_id: companyId, created_by: userId, updated_by: userId });
        return await this.typeRepo.save(type);
    }

    async findAll(companyId: string, filter: FilterExperienceTypeDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.typeRepo.createQueryBuilder('etype').where('etype.company_id = :companyId', { companyId }).andWhere('etype.deleted_at IS NULL');

        if (rest.name) qb.andWhere('etype.name ILIKE :name', { name: `%${rest.name}%` });
        if (rest.is_active !== undefined) qb.andWhere('etype.is_active = :is_active', { is_active: rest.is_active });

        const total = await qb.getCount();
        const data = await qb.orderBy(`etype.${sortBy}`, sortOrder).skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<ExperienceType> {
        const type = await this.typeRepo.findOne({ where: { id, company_id: companyId, deleted_at: null } });
        if (!type) throw new NotFoundException(`Experience type ${id} not found`);
        return type;
    }

    async update(id: string, dto: UpdateExperienceTypeDto, companyId: string, userId: string): Promise<ExperienceType> {
        const type = await this.findOne(id, companyId);
        Object.assign(type, dto);
        type.updated_by = userId;
        return await this.typeRepo.save(type);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.typeRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.typeRepo.delete(id);
    }

    async findActive(companyId: string): Promise<ExperienceType[]> {
        return await this.typeRepo.find({ where: { company_id: companyId, is_active: true, deleted_at: null }, order: { name: 'ASC' } });
    }
}
