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

export type IntegrationProvider = 'google' | 'microsoft';

/**
 * Per-company connected accounts/mailboxes for integrations.
 * Used for "send from different email IDs" with per-mailbox OAuth tokens.
 */
@Entity('integration_accounts')
@Index('idx_integration_accounts_company_provider_email', ['company_id', 'provider', 'email'], { unique: true })
export class IntegrationAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company?: Company;

    @Column('varchar', { length: 30 })
    provider: IntegrationProvider;

    @Column('varchar', { length: 320 })
    email: string;

    @Column('boolean', { default: false })
    is_verified: boolean;

    @Column('boolean', { default: true })
    is_active: boolean;

    @Column('jsonb', { default: {} })
    config: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}

