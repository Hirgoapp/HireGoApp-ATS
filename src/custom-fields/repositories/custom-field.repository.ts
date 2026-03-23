import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { CustomField } from '../entities/custom-field.entity';

@Injectable()
export class CustomFieldRepository {
    constructor(
        @InjectRepository(CustomField)
        private repository: Repository<CustomField>
    ) { }

    async findByCompanyAndEntity(
        companyId: string,
        entityType: string
    ): Promise<CustomField[]> {
        return this.repository.find({
            where: {
                company_id: companyId,
                entity_type: entityType,
                is_active: true,
                deleted_at: IsNull(),
            },
            order: { display_order: 'ASC' },
        });
    }

    async findById(id: string, companyId: string): Promise<CustomField | null> {
        return this.repository.findOne({
            where: {
                id,
                company_id: companyId,
                deleted_at: IsNull(),
            },
        });
    }

    async findBySlug(
        slug: string,
        companyId: string,
        entityType: string
    ): Promise<CustomField | null> {
        return this.repository.findOne({
            where: {
                slug,
                company_id: companyId,
                entity_type: entityType,
                deleted_at: IsNull(),
            },
        });
    }

    async create(field: Partial<CustomField>): Promise<CustomField> {
        const created = this.repository.create(field);
        return this.repository.save(created);
    }

    async update(
        id: string,
        companyId: string,
        updates: Partial<CustomField>
    ): Promise<CustomField> {
        await this.repository.update(
            { id, company_id: companyId },
            updates
        );
        return this.findById(id, companyId);
    }

    async softDelete(id: string, companyId: string): Promise<void> {
        await this.repository.update(
            { id, company_id: companyId },
            { deleted_at: new Date() }
        );
    }

    async findByIds(
        ids: string[],
        companyId: string
    ): Promise<CustomField[]> {
        return this.repository.find({
            where: {
                id: Not(undefined),
                company_id: companyId,
                deleted_at: IsNull(),
            },
        });
    }
}
