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
 * Per-company feature flags. Enables/disables modules (e.g. clients_module, jobs_module, candidates_module)
 * for a tenant without code changes. Table: company_feature_flags.
 */
@Entity('company_feature_flags')
@Index(['company_id', 'feature_key'], { unique: true })
export class CompanyFeatureFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company?: Company;

    @Column('varchar', { length: 100 })
    feature_key: string;

    @Column('boolean', { default: false })
    is_enabled: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
