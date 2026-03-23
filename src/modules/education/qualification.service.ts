import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qualification } from './entities/qualification.entity';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
import { FilterQualificationDto } from './dto/filter-qualification.dto';

@Injectable()
export class QualificationService {
    constructor(
        @InjectRepository(Qualification)
        private readonly qualificationRepo: Repository<Qualification>,
    ) { }

    async create(dto: CreateQualificationDto, companyId: string, userId: string): Promise<Qualification> {
        const entity = this.qualificationRepo.create({ ...dto, company_id: companyId, created_by: userId, updated_by: userId });
        return await this.qualificationRepo.save(entity);
    }

    async findAll(companyId: string, filter: FilterQualificationDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.qualificationRepo.createQueryBuilder('qualification').where('qualification.company_id = :companyId', { companyId }).andWhere('qualification.deleted_at IS NULL');

        if (rest.name) qb.andWhere('qualification.name ILIKE :name', { name: `%${rest.name}%` });
        if (rest.level) qb.andWhere('qualification.level ILIKE :level', { level: `%${rest.level}%` });
        if (rest.is_active !== undefined) qb.andWhere('qualification.is_active = :is_active', { is_active: rest.is_active });

        const total = await qb.getCount();
        const data = await qb.orderBy(`qualification.${sortBy}`, sortOrder).skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Qualification> {
        const qualification = await this.qualificationRepo.findOne({ where: { id, company_id: companyId, deleted_at: null } });
        if (!qualification) throw new NotFoundException(`Qualification ${id} not found`);
        return qualification;
    }

    async update(id: string, dto: UpdateQualificationDto, companyId: string, userId: string): Promise<Qualification> {
        const qualification = await this.findOne(id, companyId);
        Object.assign(qualification, dto);
        qualification.updated_by = userId;
        return await this.qualificationRepo.save(qualification);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.qualificationRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.qualificationRepo.delete(id);
    }

    async findActive(companyId: string): Promise<Qualification[]> {
        return await this.qualificationRepo.find({ where: { company_id: companyId, is_active: true, deleted_at: null }, order: { name: 'ASC' } });
    }
}
