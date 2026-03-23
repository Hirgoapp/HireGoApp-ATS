import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    Index,
    Unique,
} from 'typeorm';
import { LicenseFeature } from './license-feature.entity';

export enum LicenseTier {
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

export enum LicenseStatus {
    TRIAL = 'trial',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

@Entity('licenses')
@Index(['company_id'])
@Index(['tier', 'status'])
@Index(['expires_at'])
@Unique(['company_id'])
export class License {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string; // Tenant ID

    // License Details
    @Column('varchar', { length: 50 })
    tier: LicenseTier;

    @Column('varchar', { length: 50 })
    status: LicenseStatus;

    // Billing Cycle
    @Column('varchar', { length: 50, nullable: true })
    billing_cycle: 'monthly' | 'annual' | 'custom';

    @Column('boolean', { default: true })
    auto_renew: boolean;

    // Dates
    @Column('timestamp')
    starts_at: Date;

    @Column('timestamp')
    expires_at: Date;

    @Column('timestamp', { nullable: true })
    cancelled_at: Date;

    // Custom Limits (for ENTERPRISE)
    @Column('jsonb', { default: '{}' })
    custom_limits: Record<string, any>;

    // Metadata
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;

    // Relations
    @OneToMany(() => LicenseFeature, (lf) => lf.license, {
        onDelete: 'CASCADE',
        eager: false
    })
    license_features: LicenseFeature[];
}
