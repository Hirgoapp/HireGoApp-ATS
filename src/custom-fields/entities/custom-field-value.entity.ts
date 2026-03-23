import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('custom_field_values')
@Index(['company_id', 'custom_field_id'])
@Index(['company_id', 'entity_type', 'entity_id'])
@Index(['company_id', 'value_text'], {
    where: 'value_text IS NOT NULL',
})
@Unique('uq_field_entity_value', [
    'company_id',
    'custom_field_id',
    'entity_type',
    'entity_id',
])
export class CustomFieldValue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    // Field Reference
    @Column('uuid')
    custom_field_id: string;

    // Entity Reference
    @Column('varchar', { length: 50 })
    entity_type: string;

    @Column('uuid')
    entity_id: string;

    // Value Storage (one per field type)
    @Column('text', { nullable: true })
    value_text: string;

    @Column('numeric', { precision: 18, scale: 4, nullable: true })
    value_number: number;

    @Column('date', { nullable: true })
    value_date: Date;

    @Column('timestamp', { nullable: true })
    value_datetime: Date;

    @Column('boolean', { nullable: true })
    value_boolean: boolean;

    @Column('jsonb', { nullable: true })
    value_json: any;

    // Metadata
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
