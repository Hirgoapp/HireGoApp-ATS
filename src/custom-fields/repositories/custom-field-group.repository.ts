import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomFieldGroup } from '../entities/custom-field-group.entity';

@Injectable()
export class CustomFieldGroupRepository {
    constructor(
        @InjectRepository(CustomFieldGroup)
        private repository: Repository<CustomFieldGroup>
    ) { }

    async findByCompanyAndEntity(
        companyId: string,
        entityType: string
    ): Promise<CustomFieldGroup[]> {
        return this.repository.find({
            where: {
                company_id: companyId,
                entity_type: entityType,
            },
            order: { display_order: 'ASC' },
        });
    }

    async findById(id: string, companyId: string): Promise<CustomFieldGroup | null> {
        return this.repository.findOne({
            where: {
                id,
                company_id: companyId,
            },
        });
    }

    async create(group: Partial<CustomFieldGroup>): Promise<CustomFieldGroup> {
        const created = this.repository.create(group);
        return this.repository.save(created);
    }

    async update(
        id: string,
        companyId: string,
        updates: Partial<CustomFieldGroup>
    ): Promise<CustomFieldGroup> {
        await this.repository.update(
            { id, company_id: companyId },
            updates
        );
        return this.findById(id, companyId);
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.repository.delete({ id, company_id: companyId });
    }
}
