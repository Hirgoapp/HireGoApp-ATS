import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

/**
 * Tenant-level key/value settings stored as JSONB.
 * One row per (company_id, setting_key).
 */
@Entity('settings')
@Index('idx_settings_company_key', ['company_id', 'setting_key'], { unique: true })
export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 100 })
    setting_key: string;

    @Column({ type: 'jsonb', nullable: true })
    setting_value: any;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

