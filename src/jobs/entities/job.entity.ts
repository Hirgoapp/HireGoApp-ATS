import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Pipeline } from '../../modules/pipelines/entities/pipeline.entity';

/**
 * Job Entity
 * Table: jobs
 * Multi-tenant ATS job postings
 */
@Entity('jobs')
@Index(['company_id'])
@Index(['company_id', 'status'])
@Index(['company_id', 'pipeline_id'])
export class Job {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    requirements: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    job_code: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    department: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    salary_min: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    salary_max: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    salary_currency: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    employment_type: string; // Full-time, Part-time, Contract, Temporary

    @Column({ type: 'varchar', length: 50, default: 'open' })
    status: string; // open, closed, on-hold, cancelled

    @Column({ type: 'uuid', nullable: true })
    pipeline_id: string;

    @ManyToOne(() => Pipeline, { nullable: true })
    @JoinColumn({ name: 'pipeline_id' })
    pipeline: Pipeline;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Column({ type: 'uuid', nullable: true })
    hiring_manager_id: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'hiring_manager_id' })
    hiring_manager: User;

    @Column({ type: 'jsonb', default: {} })
    custom_fields: Record<string, any>;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    // Additional fields
    @Column({ type: 'varchar', length: 50, nullable: true })
    level: string; // Junior, Mid, Senior, Lead, etc.

    @Column({ type: 'int', nullable: true })
    years_required: number;

    @Column({ type: 'varchar', length: 10, nullable: true })
    currency: string;

    @Column({ type: 'boolean', default: false })
    is_remote: boolean;

    @Column({ type: 'boolean', default: false })
    is_hybrid: boolean;

    @Column({ type: 'int', default: 1 })
    priority: number; // 1=Low, 2=Medium, 3=High

    @Column({ type: 'date', nullable: true })
    target_hire_date: Date;

    @Column({ type: 'int', default: 1 })
    openings: number; // Number of positions

    @Column({ type: 'jsonb', default: [] })
    required_skills: string[];

    @Column({ type: 'jsonb', default: [] })
    preferred_skills: string[];

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ type: 'text', nullable: true })
    internal_notes: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    source: string; // Posted manually, imported, etc.

    @Column({ type: 'uuid', nullable: true })
    updated_by_id: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by_id' })
    updated_by: User;
}
