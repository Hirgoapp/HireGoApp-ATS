import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('custom_field_groups')
@Index(['company_id', 'entity_type'])
@Unique('uq_company_name_entity', ['company_id', 'name', 'entity_type'])
export class CustomFieldGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('varchar', { length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('varchar', { length: 50 })
    entity_type: string;

    @Column('int', { default: 0 })
    display_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
