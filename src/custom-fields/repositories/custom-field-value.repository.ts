import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CustomFieldValue } from '../entities/custom-field-value.entity';

@Injectable()
export class CustomFieldValueRepository {
    constructor(
        @InjectRepository(CustomFieldValue)
        private repository: Repository<CustomFieldValue>
    ) { }

    async findByEntityAndField(
        companyId: string,
        fieldId: string,
        entityType: string,
        entityId: string
    ): Promise<CustomFieldValue | null> {
        return this.repository.findOne({
            where: {
                company_id: companyId,
                custom_field_id: fieldId,
                entity_type: entityType,
                entity_id: entityId,
            },
        });
    }

    async findByEntity(
        companyId: string,
        entityType: string,
        entityId: string
    ): Promise<CustomFieldValue[]> {
        return this.repository.find({
            where: {
                company_id: companyId,
                entity_type: entityType,
                entity_id: entityId,
            },
        });
    }

    async findByField(
        companyId: string,
        fieldId: string
    ): Promise<CustomFieldValue[]> {
        return this.repository.find({
            where: {
                company_id: companyId,
                custom_field_id: fieldId,
            },
        });
    }

    async create(value: Partial<CustomFieldValue>): Promise<CustomFieldValue> {
        const created = this.repository.create(value);
        return this.repository.save(created);
    }

    async update(
        id: string,
        updates: Partial<CustomFieldValue>
    ): Promise<CustomFieldValue> {
        await this.repository.update({ id }, updates);
        return this.repository.findOne({ where: { id } });
    }

    async createOrUpdate(
        companyId: string,
        fieldId: string,
        entityType: string,
        entityId: string,
        value: Partial<CustomFieldValue>
    ): Promise<CustomFieldValue> {
        let fieldValue = await this.findByEntityAndField(
            companyId,
            fieldId,
            entityType,
            entityId
        );

        if (!fieldValue) {
            return this.create({
                company_id: companyId,
                custom_field_id: fieldId,
                entity_type: entityType,
                entity_id: entityId,
                ...value,
            });
        }

        return this.update(fieldValue.id, value);
    }

    async deleteByField(companyId: string, fieldId: string): Promise<void> {
        await this.repository.delete({
            company_id: companyId,
            custom_field_id: fieldId,
        });
    }

    async checkUniqueness(
        companyId: string,
        fieldId: string,
        value: string,
        excludeEntityId?: string
    ): Promise<boolean> {
        const query = this.repository.createQueryBuilder('cfv')
            .where('cfv.company_id = :companyId', { companyId })
            .andWhere('cfv.custom_field_id = :fieldId', { fieldId })
            .andWhere('cfv.value_text = :value', { value });

        if (excludeEntityId) {
            query.andWhere('cfv.entity_id != :excludeEntityId', { excludeEntityId });
        }

        const existing = await query.getOne();
        return !existing;
    }
}
