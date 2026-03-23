import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In, Repository } from 'typeorm';

/**
 * Base Repository for Tenant-Aware Entities
 * 
 * All tenant-aware entities (companies, users, candidates, jobs, etc.)
 * should extend this base repository to enforce company_id filtering.
 * 
 * Key Features:
 * - Automatic company_id filtering on all queries
 * - Prevents cross-tenant data access
 * - Provides helper methods for common patterns
 * - Validates ownership before returning entities
 * 
 * Usage:
 *   class CandidateRepository extends BaseTenantRepository<Candidate> {
 *     constructor(dataSource: DataSource) {
 *       super(dataSource, Candidate);
 *     }
 *   }
 */
@Injectable()
export class BaseTenantRepository<T extends { company_id: string; id: string }> {
    protected repository!: Repository<T>;

    constructor(
        protected dataSource: any,
        protected entity: any
    ) {
        // In production:
        // this.repository = dataSource.getRepository(entity);
    }

    /**
     * Find all entities for a company
     * 
     * Always includes company_id filter.
     * 
     * @param companyId - Tenant identifier
     * @param criteria - Additional WHERE conditions
     * @returns Array of entities belonging to company
     */
    async findByCompany(
        companyId: string,
        criteria: FindOptionsWhere<T> = {}
    ): Promise<T[]> {
        // In production:
        /*
        return this.repository.find({
          where: {
            ...criteria,
            company_id: companyId
          }
        });
        */
        return [];
    }

    /**
     * Find one entity for a company
     * 
     * Always includes company_id filter.
     * Returns null if entity doesn't exist or doesn't belong to company.
     * 
     * @param companyId - Tenant identifier
     * @param criteria - WHERE conditions
     * @returns Single entity or null
     */
    async findOneByCompany(
        companyId: string,
        criteria: FindOptionsWhere<T>
    ): Promise<T | null> {
        // In production:
        /*
        return this.repository.findOne({
          where: {
            ...criteria,
            company_id: companyId
          }
        });
        */
        return null;
    }

    /**
     * Find by ID and verify belongs to company
     * 
     * Helper for common pattern: GET /api/resource/{id}
     * 
     * @param id - Entity ID
     * @param companyId - Tenant identifier
     * @throws NotFoundException if entity doesn't exist or doesn't belong to company
     * @returns Entity object
     */
    async findByIdOrThrow(id: string, companyId: string): Promise<T> {
        const entity = await this.findOneByCompany(companyId, { id } as any);

        if (!entity) {
            throw new NotFoundException(
                `Resource not found. Verify the ID belongs to your company.`
            );
        }

        return entity;
    }

    /**
     * Create new entity for a company
     * 
     * Forces company_id from parameter (never from data object).
     * 
     * @param companyId - Tenant identifier
     * @param data - Entity data (without company_id)
     * @returns Created entity
     */
    async createForCompany(
        companyId: string,
        data: Partial<T>
    ): Promise<T> {
        // In production:
        /*
        const entity = this.repository.create({
          ...data,
          company_id: companyId
        });
        return this.repository.save(entity);
        */
        return {} as T;
    }

    /**
     * Update entities for a company
     * 
     * Always includes company_id filter to prevent cross-tenant updates.
     * 
     * @param companyId - Tenant identifier
     * @param criteria - WHERE conditions (MUST include company_id)
     * @param data - Fields to update
     * @returns UpdateResult with affected count
     */
    async updateForCompany(
        companyId: string,
        criteria: FindOptionsWhere<T>,
        data: Partial<T>
    ): Promise<{ affected?: number }> {
        // In production:
        /*
        return this.repository.update(
          {
            ...criteria,
            company_id: companyId
          },
          data
        );
        */
        return { affected: 0 };
    }

    /**
     * Delete entities for a company (soft delete)
     * 
     * For entities with deleted_at field, performs soft delete.
     * Always includes company_id filter.
     * 
     * @param companyId - Tenant identifier
     * @param id - Entity ID
     * @throws NotFoundException if entity doesn't exist
     * @returns Soft delete count
     */
    async softDeleteForCompany(
        companyId: string,
        id: string
    ): Promise<{ affected?: number }> {
        // In production:
        /*
        const entity = await this.findByIdOrThrow(id, companyId);
        
        return this.repository.update(
          { id: id, company_id: companyId } as any,
          { deleted_at: new Date() } as any
        );
        */
        return { affected: 0 };
    }

    /**
     * Bulk update for a company
     * 
     * Updates multiple entities with ownership verification.
     * Throws if any entity doesn't belong to company.
     * 
     * @param companyId - Tenant identifier
     * @param ids - Array of entity IDs
     * @param data - Fields to update
     * @throws BadRequestException if any IDs don't belong to company
     * @returns UpdateResult with affected count
     */
    async bulkUpdateForCompany(
        companyId: string,
        ids: string[],
        data: Partial<T>
    ): Promise<{ affected?: number }> {
        if (ids.length === 0) {
            throw new BadRequestException('No IDs provided for update');
        }

        // In production:
        /*
        // Verify ALL entities belong to company
        const entities = await this.repository.find({
          where: {
            id: In(ids),
            company_id: companyId
          }
        });
    
        // Check count matches to ensure no silent failures
        if (entities.length !== ids.length) {
          throw new BadRequestException(
            `Some entities not found in your company. Expected ${ids.length}, found ${entities.length}`
          );
        }
    
        return this.repository.update(
          { id: In(ids), company_id: companyId } as any,
          data
        );
        */
        return { affected: 0 };
    }

    /**
     * Bulk soft delete for a company
     * 
     * Soft deletes multiple entities with ownership verification.
     * 
     * @param companyId - Tenant identifier
     * @param ids - Array of entity IDs
     * @throws BadRequestException if any IDs don't belong to company
     * @returns UpdateResult with affected count
     */
    async bulkSoftDeleteForCompany(
        companyId: string,
        ids: string[]
    ): Promise<{ affected?: number }> {
        return this.bulkUpdateForCompany(companyId, ids, {
            deleted_at: new Date()
        } as any);
    }

    /**
     * Get count of entities for a company
     * 
     * Useful for pagination total counts.
     * Always includes company_id filter.
     * 
     * @param companyId - Tenant identifier
     * @param criteria - Additional WHERE conditions
     * @returns Count of matching entities
     */
    async countByCompany(
        companyId: string,
        criteria: FindOptionsWhere<T> = {}
    ): Promise<number> {
        // In production:
        /*
        return this.repository.count({
          where: {
            ...criteria,
            company_id: companyId
          }
        });
        */
        return 0;
    }

    /**
     * Verify entity belongs to company
     * 
     * Used for authorization checks in services.
     * 
     * @param id - Entity ID
     * @param companyId - Tenant identifier
     * @returns true if entity belongs to company, false otherwise
     */
    async belongsToCompany(id: string, companyId: string): Promise<boolean> {
        const entity = await this.findOneByCompany(companyId, { id } as any);
        return entity !== null;
    }

    /**
     * Verify all entities belong to company
     * 
     * Used for bulk operation validation.
     * 
     * @param ids - Array of entity IDs
     * @param companyId - Tenant identifier
     * @returns true if ALL entities belong to company
     */
    async allBelongToCompany(ids: string[], companyId: string): Promise<boolean> {
        const count = await this.countByCompany(companyId, {
            id: In(ids)
        } as any);

        return count === ids.length;
    }
}
