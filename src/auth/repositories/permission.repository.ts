import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository {
    constructor(
        @InjectRepository(Permission)
        public readonly repository: Repository<Permission>
    ) { }

    // ---- New API (key/resource based) ----

    /**
     * Find permission by canonical key, e.g. "jobs:create"
     */
    async findByKey(key: string): Promise<Permission | null> {
        return this.repository.findOne({ where: { key } });
    }

    /**
     * Find all permissions for a given resource, e.g. "jobs"
     */
    async findByResource(resource: string): Promise<Permission[]> {
        return this.repository.find({
            where: { resource },
            order: { action: 'ASC' },
        });
    }

    /**
     * List all active permissions
     */
    async listActivePermissions(): Promise<Permission[]> {
        return this.repository.find({
            where: { is_active: true },
            order: { resource: 'ASC', action: 'ASC' },
        });
    }

    /**
     * Find all permissions (usually for seeding or listing)
     */
    async findAll(): Promise<Permission[]> {
        return this.repository.find();
    }

    /**
     * Create permission
     */
    async create(permissionData: Partial<Permission>): Promise<Permission> {
        const permission = this.repository.create(permissionData);
        return this.repository.save(permission);
    }

    /**
     * Create multiple permissions (for seeding)
     */
    async createMany(permissions: Partial<Permission>[]): Promise<Permission[]> {
        const entities = this.repository.create(permissions);
        return this.repository.save(entities);
    }

    /**
     * Update permission
     */
    async update(id: string, updates: Partial<Permission>): Promise<Permission> {
        await this.repository.update(id, updates);
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Delete permission
     */
    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Find by IDs
     */
    async findByIds(ids: string[]): Promise<Permission[]> {
        if (!ids.length) return [];
        return this.repository
            .createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids })
            .getMany();
    }
}
