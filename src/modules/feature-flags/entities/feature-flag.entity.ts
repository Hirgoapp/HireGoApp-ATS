import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';

export enum FlagTargeting {
    GLOBAL = 'global',
    COMPANY = 'company',
    USER = 'user',
    PERCENTAGE = 'percentage',
}

export enum FlagStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ARCHIVED = 'archived',
}

@Entity('feature_flags')
export class FeatureFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string; // e.g., 'advanced-analytics', 'bulk-import-v2'

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: FlagStatus, default: FlagStatus.INACTIVE })
    status: FlagStatus;

    @Column({ type: 'enum', enum: FlagTargeting, default: FlagTargeting.GLOBAL })
    targeting: FlagTargeting;

    @Column({ type: 'jsonb', nullable: true })
    targeting_rules: {
        company_ids?: string[];
        user_ids?: string[];
        percentage?: number; // 0-100
        environments?: string[]; // ['development', 'staging', 'production']
    };

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        tags?: string[];
        owner?: string;
        jira_ticket?: string;
        launch_date?: string;
    };

    @Column({ type: 'boolean', default: false })
    is_beta_feature: boolean;

    @Column({ type: 'int', default: 0 })
    usage_count: number; // How many times flag was checked

    @Column({ type: 'int', default: 0 })
    enabled_count: number; // How many times flag returned true

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
