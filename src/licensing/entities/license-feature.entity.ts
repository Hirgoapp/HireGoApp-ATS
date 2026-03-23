import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    Index,
    Unique,
    JoinColumn,
} from 'typeorm';
import { License } from './license.entity';

@Entity('license_features')
@Index(['license_id'])
@Unique(['license_id', 'feature_name'])
export class LicenseFeature {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    license_id: string;

    // Feature Reference
    @Column('varchar', { length: 100 })
    feature_name: string;

    // Limit Configuration
    @Column('boolean', { default: true })
    is_enabled: boolean;

    @Column('int', { nullable: true })
    usage_limit: number; // NULL = unlimited

    @Column('int', { default: 0 })
    current_usage: number;

    @Column('timestamp', { nullable: true })
    reset_date: Date; // When usage counter resets (monthly)

    // Custom Override
    @Column('jsonb', { default: '{}' })
    custom_config: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => License, (license) => license.license_features, {
        onDelete: 'CASCADE',
        eager: false
    })
    @JoinColumn({ name: 'license_id' })
    license: License;
}
