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
 * Per-company external service integrations (Google Drive, OneDrive, Slack, AWS S3, SMTP, etc.).
 * Config stores tokens, credentials, and settings. One row per (company_id, integration_type).
 */
@Entity('integrations')
@Index('idx_integrations_company_type', ['company_id', 'integration_type'], { unique: true })
export class Integration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company?: Company;

    @Column('varchar', { length: 100 })
    integration_type: string;

    @Column('jsonb', { default: {} })
    config: Record<string, unknown>;

    @Column('boolean', { default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
