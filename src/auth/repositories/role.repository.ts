import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
    constructor(
        @InjectRepository(Role)
        private readonly repository: Repository<Role>
    ) { }

    /**
     * Find role by ID
     */
    async findById(id: string): Promise<Role | null> {
        return this.repository.findOne({
            where: { id },
        });
    }

    /**
     * Find role by name
     */
    async findByName(name: string): Promise<Role | null> {
        return this.repository.findOne({
            where: { name },
        });
    }

    /**
     * Find all roles
     */
    async findAll(): Promise<Role[]> {
        return this.repository.find({
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find default role (if exists)
     */
    async findDefault(companyId: string): Promise<Role | null> {
        return this.repository.findOne({
            where: { company_id: companyId, is_default: true },
        });
    }

    /**
     * Find system role by name
     */
    async findSystemByName(name: string): Promise<Role | null> {
        return this.repository.findOne({
            where: { name, is_system: true },
        });
    }

    /**
     * Create role
     */
    async create(roleData: Partial<Role>): Promise<Role> {
        const role = this.repository.create(roleData);
        return this.repository.save(role);
    }

    /**
     * Create multiple roles (for seeding)
     */
    async createMany(roles: Partial<Role>[]): Promise<Role[]> {
        const entities = this.repository.create(roles);
        return this.repository.save(entities);
    }

    /**
     * Update role
     */
    async update(id: string, updates: Partial<Role>): Promise<Role> {
        await this.repository.update(id, updates);
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Soft delete role (not supported in simple schema)
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }

    /**
     * Check if name is unique
     */
    async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
        const query = this.repository
            .createQueryBuilder('r')
            .where('r.name = :name', { name });

        if (excludeId) {
            query.andWhere('r.id != :excludeId', { excludeId });
        }

        const count = await query.getCount();
        return count === 0;
    }
}
