import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { CustomField, CustomFieldType } from '../entities/custom-field.entity';
import { CustomFieldValue } from '../entities/custom-field-value.entity';
import { CustomFieldRepository } from '../repositories/custom-field.repository';
import { CustomFieldValueRepository } from '../repositories/custom-field-value.repository';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class CustomFieldsService {
    constructor(
        private readonly customFieldRepository: CustomFieldRepository,
        private readonly customFieldValueRepository: CustomFieldValueRepository,
        private readonly validationService: CustomFieldValidationService,
        private readonly auditService: AuditService
    ) { }

    /**
     * Create custom field for a company
     */
    async createField(
        companyId: string,
        userId: string,
        dto: {
            name: string;
            description?: string;
            entityType: string;
            fieldType: CustomFieldType;
            isRequired?: boolean;
            isUnique?: boolean;
            validationRules?: Record<string, any>;
            options?: Array<{ id: string; label: string; color?: string }>;
            displayOrder?: number;
        }
    ): Promise<CustomField> {
        // Validate field configuration
        if (
            dto.fieldType === CustomFieldType.SELECT ||
            dto.fieldType === CustomFieldType.MULTISELECT
        ) {
            if (!dto.options || dto.options.length === 0) {
                throw new BadRequestException(
                    'Options required for select fields'
                );
            }
        }

        const slug = this.generateSlug(dto.name);

        const field = await this.customFieldRepository.create({
            company_id: companyId,
            created_by_id: userId,
            slug,
            name: dto.name,
            description: dto.description,
            entity_type: dto.entityType,
            field_type: dto.fieldType,
            is_required: dto.isRequired || false,
            is_unique: dto.isUnique || false,
            validation_rules: dto.validationRules || {},
            options: dto.options || [],
            display_order: dto.displayOrder || 0,
        });

        // Audit log
        await this.auditService.log(companyId, userId, {
            entityType: 'custom_field',
            entityId: field.id,
            action: 'CUSTOM_FIELD_CREATED',
            details: {
                name: field.name,
                fieldType: field.field_type,
                entityType: field.entity_type,
            },
        });

        return field;
    }

    /**
     * Get all custom fields for entity type
     */
    async getFieldsByEntity(
        companyId: string,
        entityType: string
    ): Promise<CustomField[]> {
        return this.customFieldRepository.findByCompanyAndEntity(
            companyId,
            entityType
        );
    }

    /**
     * Get single field
     */
    async getField(
        companyId: string,
        fieldId: string
    ): Promise<CustomField> {
        const field = await this.customFieldRepository.findById(
            fieldId,
            companyId
        );

        if (!field) {
            throw new NotFoundException('Custom field not found');
        }

        return field;
    }

    /**
     * Update field configuration
     */
    async updateField(
        companyId: string,
        fieldId: string,
        userId: string,
        dto: Partial<CustomField>
    ): Promise<CustomField> {
        const field = await this.getField(companyId, fieldId);

        const updated = await this.customFieldRepository.update(
            fieldId,
            companyId,
            dto
        );

        // Audit log
        await this.auditService.log(companyId, userId, {
            entityType: 'custom_field',
            entityId: fieldId,
            action: 'CUSTOM_FIELD_UPDATED',
            details: {
                fieldName: field.name,
                changes: dto,
            },
        });

        return updated;
    }

    /**
     * Delete field (soft delete)
     */
    async deleteField(
        companyId: string,
        fieldId: string,
        userId: string
    ): Promise<void> {
        const field = await this.getField(companyId, fieldId);

        await this.customFieldRepository.softDelete(fieldId, companyId);

        // Also delete all values for this field
        await this.customFieldValueRepository.deleteByField(
            companyId,
            fieldId
        );

        // Audit log
        await this.auditService.log(companyId, userId, {
            entityType: 'custom_field',
            entityId: fieldId,
            action: 'CUSTOM_FIELD_DELETED',
            details: {
                fieldName: field.name,
            },
        });
    }

    /**
     * Set custom field value for entity
     */
    async setFieldValue(
        companyId: string,
        userId: string,
        fieldId: string,
        entityType: string,
        entityId: string,
        value: any
    ): Promise<CustomFieldValue> {
        // 1. Load field
        const field = await this.getField(companyId, fieldId);

        if (field.entity_type !== entityType) {
            throw new BadRequestException('Field type mismatch');
        }

        // 2. Validate value
        const validation = this.validationService.validateValue(
            value,
            field.field_type,
            field.validation_rules,
            field.options,
            field.is_required
        );

        if (!validation.valid) {
            throw new BadRequestException(
                validation.errors.map((e) => e.message).join(', ')
            );
        }

        // 3. Check uniqueness
        if (field.is_unique && value) {
            const isUnique = await this.customFieldValueRepository.checkUniqueness(
                companyId,
                fieldId,
                String(value),
                entityId
            );

            if (!isUnique) {
                throw new BadRequestException('This value must be unique');
            }
        }

        // 4. Create or update value
        const fieldValue = await this.customFieldValueRepository.createOrUpdate(
            companyId,
            fieldId,
            entityType,
            entityId,
            this.storeValueByType(field.field_type, value)
        );

        // Audit log
        await this.auditService.log(companyId, userId, {
            entityType: 'custom_field_value',
            entityId: fieldId,
            action: 'CUSTOM_FIELD_VALUE_SET',
            details: {
                fieldName: field.name,
                entityType,
                entityId,
            },
        });

        return fieldValue;
    }

    /**
     * Get all custom field values for entity
     */
    async getEntityValues(
        companyId: string,
        entityType: string,
        entityId: string
    ): Promise<Record<string, any>> {
        const values = await this.customFieldValueRepository.findByEntity(
            companyId,
            entityType,
            entityId
        );

        const fields = await this.getFieldsByEntity(companyId, entityType);
        const fieldMap = new Map(fields.map((f) => [f.id, f]));

        const result: Record<string, any> = {};

        for (const fieldValue of values) {
            const field = fieldMap.get(fieldValue.custom_field_id);
            if (field) {
                result[field.slug] = this.extractValue(
                    fieldValue,
                    field.field_type
                );
            }
        }

        return result;
    }

    /**
     * Get specific field value
     */
    async getFieldValue(
        companyId: string,
        fieldId: string,
        entityType: string,
        entityId: string
    ): Promise<any> {
        const fieldValue = await this.customFieldValueRepository.findByEntityAndField(
            companyId,
            fieldId,
            entityType,
            entityId
        );

        if (!fieldValue) {
            return null;
        }

        const field = await this.getField(companyId, fieldId);
        return this.extractValue(fieldValue, field.field_type);
    }

    /**
     * Bulk set values for multiple entities
     */
    async bulkSetValues(
        companyId: string,
        userId: string,
        fieldId: string,
        entityType: string,
        entityIds: string[],
        value: any
    ): Promise<{ updated: number; failed: number; errors: Record<string, string> }> {
        const field = await this.getField(companyId, fieldId);

        if (field.entity_type !== entityType) {
            throw new BadRequestException('Field type mismatch');
        }

        const errors: Record<string, string> = {};
        let updated = 0;
        let failed = 0;

        for (const entityId of entityIds) {
            try {
                await this.setFieldValue(
                    companyId,
                    userId,
                    fieldId,
                    entityType,
                    entityId,
                    value
                );
                updated++;
            } catch (error) {
                errors[entityId] = error.message;
                failed++;
            }
        }

        return { updated, failed, errors };
    }

    /**
     * Generate slug from field name
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }

    /**
     * Store value in appropriate column based on type
     */
    private storeValueByType(
        fieldType: CustomFieldType,
        value: any
    ): Partial<CustomFieldValue> {
        const stored: Partial<CustomFieldValue> = {};

        switch (fieldType) {
            case CustomFieldType.TEXT:
            case CustomFieldType.TEXTAREA:
            case CustomFieldType.EMAIL:
            case CustomFieldType.URL:
            case CustomFieldType.PHONE:
            case CustomFieldType.SELECT:
            case CustomFieldType.RICH_TEXT:
                stored.value_text = String(value);
                break;

            case CustomFieldType.NUMBER:
            case CustomFieldType.CURRENCY:
            case CustomFieldType.RATING:
                stored.value_number = Number(value);
                break;

            case CustomFieldType.DATE:
                stored.value_date = new Date(value);
                break;

            case CustomFieldType.DATETIME:
                stored.value_datetime = new Date(value);
                break;

            case CustomFieldType.BOOLEAN:
                stored.value_boolean = Boolean(value);
                break;

            case CustomFieldType.MULTISELECT:
                stored.value_json = Array.isArray(value) ? value : [value];
                break;
        }

        return stored;
    }

    /**
     * Extract value from appropriate column based on type
     */
    private extractValue(
        fieldValue: CustomFieldValue,
        fieldType: CustomFieldType
    ): any {
        switch (fieldType) {
            case CustomFieldType.TEXT:
            case CustomFieldType.TEXTAREA:
            case CustomFieldType.EMAIL:
            case CustomFieldType.URL:
            case CustomFieldType.PHONE:
            case CustomFieldType.SELECT:
            case CustomFieldType.RICH_TEXT:
                return fieldValue.value_text;

            case CustomFieldType.NUMBER:
            case CustomFieldType.CURRENCY:
            case CustomFieldType.RATING:
                return fieldValue.value_number;

            case CustomFieldType.DATE:
                return fieldValue.value_date;

            case CustomFieldType.DATETIME:
                return fieldValue.value_datetime;

            case CustomFieldType.BOOLEAN:
                return fieldValue.value_boolean;

            case CustomFieldType.MULTISELECT:
                return fieldValue.value_json;

            default:
                return null;
        }
    }
}
