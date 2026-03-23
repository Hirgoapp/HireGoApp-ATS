import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('feature_flags')
@Index(['status'])
@Index(['is_enabled_globally'])
@Unique(['name'])
export class FeatureFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Flag Identity
    @Column('varchar', { length: 100 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    // Flag Configuration
    @Column('varchar', { length: 50 })
    flag_type: 'boolean' | 'percentage' | 'user_list';

    @Column('varchar', { length: 50, default: 'draft' })
    status: 'draft' | 'active' | 'archived';

    // Global Settings
    @Column('boolean', { default: false })
    is_enabled_globally: boolean;

    @Column('int', { nullable: true })
    enabled_percentage: number; // For gradual rollout (0-100)

    // Audience Targeting
    @Column('text', { array: true, nullable: true })
    target_tiers: string[]; // Which license tiers: ['premium', 'enterprise']

    @Column('uuid', { array: true, nullable: true })
    excluded_companies: string[];

    @Column('uuid', { array: true, nullable: true })
    included_companies: string[];

    // Configuration
    @Column('jsonb', { default: '{}' })
    config: Record<string, any>;

    // Scheduling
    @Column('timestamp', { nullable: true })
    scheduled_at: Date;

    @Column('timestamp', { nullable: true })
    scheduled_end_at: Date;

    // Metadata
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column('uuid', { nullable: true })
    created_by_id: string;
}
