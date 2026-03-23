import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Source } from './entities/source.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { FilterSourceDto } from './dto/filter-source.dto';

@Injectable()
export class SourceService {
    constructor(
        @InjectRepository(Source)
        private readonly sourceRepository: Repository<Source>,
    ) { }

    async create(createSourceDto: CreateSourceDto, companyId: string, userId: string): Promise<Source> {
        const source = this.sourceRepository.create({
            ...createSourceDto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });

        return await this.sourceRepository.save(source);
    }

    async findAll(companyId: string, filterDto: FilterSourceDto): Promise<{ data: Source[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...filters } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.sourceRepository
            .createQueryBuilder('source')
            .where('source.company_id = :companyId', { companyId })
            .andWhere('source.deleted_at IS NULL');

        if (filters.name) {
            queryBuilder.andWhere('source.name ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.type) {
            queryBuilder.andWhere('source.type = :type', { type: filters.type });
        }

        if (filters.is_active !== undefined) {
            queryBuilder.andWhere('source.is_active = :is_active', { is_active: filters.is_active });
        }

        const total = await queryBuilder.getCount();

        const data = await queryBuilder
            .orderBy(`source.${sortBy}`, sortOrder)
            .skip(skip)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Source> {
        const source = await this.sourceRepository.findOne({
            where: { id, company_id: companyId, deleted_at: null },
            relations: ['company', 'creator', 'updater'],
        });

        if (!source) {
            throw new NotFoundException(`Source with ID ${id} not found`);
        }

        return source;
    }

    async update(id: string, updateSourceDto: UpdateSourceDto, companyId: string, userId: string): Promise<Source> {
        const source = await this.findOne(id, companyId);

        Object.assign(source, updateSourceDto);
        source.updated_by = userId;

        return await this.sourceRepository.save(source);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const source = await this.findOne(id, companyId);
        await this.sourceRepository.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        const source = await this.findOne(id, companyId);
        await this.sourceRepository.delete(id);
    }

    async getCount(companyId: string): Promise<number> {
        return await this.sourceRepository.count({
            where: { company_id: companyId, deleted_at: null },
        });
    }

    async getCountByType(companyId: string, type: string): Promise<number> {
        return await this.sourceRepository.count({
            where: { company_id: companyId, type, deleted_at: null },
        });
    }

    async findByType(companyId: string, type: string): Promise<Source[]> {
        return await this.sourceRepository.find({
            where: { company_id: companyId, type, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async findActive(companyId: string): Promise<Source[]> {
        return await this.sourceRepository.find({
            where: { company_id: companyId, is_active: true, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async getStats(companyId: string): Promise<{ totalSources: number; activeSources: number; totalCostPerHire: number; avgEffectiveness: number }> {
        const sources = await this.sourceRepository.find({
            where: { company_id: companyId, deleted_at: null },
        });

        const totalSources = sources.length;
        const activeSources = sources.filter((s) => s.is_active).length;
        const totalCostPerHire = sources.reduce((sum, s) => sum + (s.cost_per_hire || 0), 0);
        const ratingsSum = sources.filter((s) => s.effectiveness_rating).reduce((sum, s) => sum + (s.effectiveness_rating || 0), 0);
        const avgEffectiveness = sources.filter((s) => s.effectiveness_rating).length > 0 ? ratingsSum / sources.filter((s) => s.effectiveness_rating).length : 0;

        return { totalSources, activeSources, totalCostPerHire, avgEffectiveness };
    }
}
