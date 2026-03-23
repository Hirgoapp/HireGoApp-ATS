import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('feature_flag_usage')
@Index(['company_id', 'feature_flag_id'])
@Index(['feature_flag_id'])
@Unique(['feature_flag_id', 'company_id'])
export class FeatureFlagUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    feature_flag_id: string;

    @Column('uuid')
    company_id: string;

    // Usage Tracking
    @Column('timestamp', { nullable: true })
    enabled_at: Date;

    @Column('timestamp', { nullable: true })
    last_accessed_at: Date;

    @Column('int', { default: 0 })
    access_count: number;

    @CreateDateColumn()
    created_at: Date;
}
