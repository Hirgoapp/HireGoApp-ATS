import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterLocationDto } from './dto/filter-location.dto';

@Injectable()
export class LocationService {
    constructor(
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
    ) { }

    async create(createLocationDto: CreateLocationDto, companyId: string, userId: string): Promise<Location> {
        const location = this.locationRepository.create({
            ...createLocationDto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });

        return await this.locationRepository.save(location);
    }

    async findAll(companyId: string, filterDto: FilterLocationDto): Promise<{ data: Location[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...filters } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.locationRepository
            .createQueryBuilder('location')
            .where('location.company_id = :companyId', { companyId })
            .andWhere('location.deleted_at IS NULL');

        if (filters.name) {
            queryBuilder.andWhere('location.name ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.city) {
            queryBuilder.andWhere('location.city ILIKE :city', { city: `%${filters.city}%` });
        }

        if (filters.state) {
            queryBuilder.andWhere('location.state ILIKE :state', { state: `%${filters.state}%` });
        }

        if (filters.country) {
            queryBuilder.andWhere('location.country ILIKE :country', { country: `%${filters.country}%` });
        }

        if (filters.is_headquarters !== undefined) {
            queryBuilder.andWhere('location.is_headquarters = :is_headquarters', { is_headquarters: filters.is_headquarters });
        }

        if (filters.is_active !== undefined) {
            queryBuilder.andWhere('location.is_active = :is_active', { is_active: filters.is_active });
        }

        const total = await queryBuilder.getCount();

        const data = await queryBuilder
            .orderBy(`location.${sortBy}`, sortOrder)
            .skip(skip)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Location> {
        const location = await this.locationRepository.findOne({
            where: { id, company_id: companyId, deleted_at: null },
            relations: ['company', 'creator', 'updater'],
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    async update(id: string, updateLocationDto: UpdateLocationDto, companyId: string, userId: string): Promise<Location> {
        const location = await this.findOne(id, companyId);

        Object.assign(location, updateLocationDto);
        location.updated_by = userId;

        return await this.locationRepository.save(location);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const location = await this.findOne(id, companyId);
        await this.locationRepository.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        const location = await this.findOne(id, companyId);
        await this.locationRepository.delete(id);
    }

    async getCount(companyId: string): Promise<number> {
        return await this.locationRepository.count({
            where: { company_id: companyId, deleted_at: null },
        });
    }

    async findByCity(companyId: string, city: string): Promise<Location[]> {
        return await this.locationRepository.find({
            where: { company_id: companyId, city, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async findActive(companyId: string): Promise<Location[]> {
        return await this.locationRepository.find({
            where: { company_id: companyId, is_active: true, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async findHeadquarters(companyId: string): Promise<Location | null> {
        return await this.locationRepository.findOne({
            where: { company_id: companyId, is_headquarters: true, deleted_at: null },
        });
    }

    async setHeadquarters(id: string, companyId: string, userId: string): Promise<Location> {
        // Unset current headquarters
        await this.locationRepository.update(
            { company_id: companyId, is_headquarters: true },
            { is_headquarters: false, updated_by: userId },
        );

        // Set new headquarters
        const location = await this.findOne(id, companyId);
        location.is_headquarters = true;
        location.updated_by = userId;

        return await this.locationRepository.save(location);
    }

    async searchLocations(companyId: string, searchTerm: string): Promise<Location[]> {
        return await this.locationRepository
            .createQueryBuilder('location')
            .where('location.company_id = :companyId', { companyId })
            .andWhere('location.deleted_at IS NULL')
            .andWhere('(location.name ILIKE :searchTerm OR location.city ILIKE :searchTerm OR location.country ILIKE :searchTerm)', {
                searchTerm: `%${searchTerm}%`,
            })
            .orderBy('location.name', 'ASC')
            .limit(10)
            .getMany();
    }
}
