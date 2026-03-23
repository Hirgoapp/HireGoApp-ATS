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
import { Company } from '../../../companies/entities/company.entity';
import { Job } from './job.entity';

/**
 * JobCandidateTracker Entity
 * Stores the expected candidate submission format/tracker for each job
 * Defines required fields, validation rules, and submission templates
 */
@Entity('job_candidate_trackers')
@Index(['job_id'])
export class JobCandidateTracker {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    job_id: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 255, default: 'Candidate Tracker' })
    tracker_name: string;

    @Column({ type: 'jsonb' })
    required_fields: Array<{
        field: string;
        type: string; // 'text', 'date', 'email', 'phone', 'file', etc.
        required: boolean;
        description?: string;
    }>;

    @Column({ type: 'text', array: true, nullable: true })
    field_order: string[]; // Order of fields for display

    @Column({ type: 'jsonb', nullable: true })
    validation_rules: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    template_content: string; // Original table/format from email

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
