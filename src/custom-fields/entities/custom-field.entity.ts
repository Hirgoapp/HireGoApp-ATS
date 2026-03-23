import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';

export enum CustomFieldType {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    DATE = 'date',
    DATETIME = 'datetime',
    BOOLEAN = 'boolean',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    URL = 'url',
    EMAIL = 'email',
    PHONE = 'phone',
    CURRENCY = 'currency',
    RATING = 'rating',
    RICH_TEXT = 'rich_text',
}

export enum CustomFieldEntity {
    CANDIDATE = 'candidate',
    JOB = 'job',
    APPLICATION = 'application',
    USER = 'user',
}

export interface ValidationRules {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    decimalPlaces?: number;
    minDate?: string;
    maxDate?: string;
    disablePastDates?: boolean;
    disableFutureDates?: boolean;
    allowCustomOptions?: boolean;
    customErrorMessage?: string;
}

export interface FieldOption {
    id: string;
    label: string;
    color?: string;
}

@Entity('custom_fields')
@Index(['company_id', 'entity_type', 'is_active'])
@Index(['company_id', 'display_order'])
@Unique('uq_company_slug_entity', ['company_id', 'slug', 'entity_type'])
export class CustomField {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    // Field Identity
    @Column('varchar', { length: 255 })
    name: string;

    @Column('varchar', { length: 100 })
    slug: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('varchar', { length: 50 })
    entity_type: string; // CustomFieldEntity enum value as string

    // Field Configuration
    @Column('varchar', { length: 50 })
    field_type: CustomFieldType;

    @Column('boolean', { default: false })
    is_required: boolean;

    @Column('boolean', { default: false })
    is_unique: boolean;

    // Validation Rules
    @Column('jsonb', { default: '{}' })
    validation_rules: ValidationRules;

    // Display Configuration
    @Column('int', { default: 0 })
    display_order: number;

    @Column('jsonb', {
        default: '{"show_in_list": true, "show_in_profile": true}',
    })
    visibility_settings: Record<string, any>;

    // Options for select/multiselect
    @Column('jsonb', { default: '[]' })
    options: FieldOption[];

    // Status
    @Column('boolean', { default: true })
    is_active: boolean;

    @Column('boolean', { default: true })
    is_searchable: boolean;

    // Metadata
    @Column('uuid', { nullable: true })
    created_by_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;
}
