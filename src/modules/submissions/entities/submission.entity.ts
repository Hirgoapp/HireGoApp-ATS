import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { Candidate } from '../../../candidate/entities/candidate.entity';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../../auth/entities/user.entity';
import { SubmissionStatusHistory } from './submission-status-history.entity';

export enum SubmissionStatus {
    APPLIED = 'Applied',
    SCREENING = 'Screening',
    INTERVIEW = 'Interview',
    OFFER = 'Offer',
    HIRED = 'Hired',
    REJECTED = 'Rejected',
    WITHDRAWN = 'Withdrawn',
}

export enum SubmissionOutcome {
    JOINED = 'joined',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
}

@Entity('submissions')
@Index('idx_submissions_company_deleted', ['company_id', 'deleted_at'])
@Index('idx_submissions_job_status', ['job_id', 'status', 'deleted_at'])
@Index('idx_submissions_candidate_status', ['candidate_id', 'status', 'deleted_at'])
@Index('idx_submissions_created_at', ['company_id', 'created_at'])
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('uuid')
    candidate_id: string;

    @Column('uuid')
    job_id: string;

    /**
     * Current pipeline stage (DB column: current_stage)
     */
    @Column({ name: 'current_stage', type: 'varchar', length: 100 })
    status: SubmissionStatus;

    @Column({ type: 'date' })
    submitted_at: Date;

    @Column({ type: 'date' })
    moved_to_stage_at: Date;

    @Column({ type: 'varchar', length: 50, nullable: true })
    outcome: string | null;

    @Column({ type: 'date', nullable: true })
    outcome_date: Date | null;

    @Column({ type: 'text', nullable: true })
    internal_notes: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    source: string | null;

    @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
    score: number | null;

    @Column({ type: 'jsonb', nullable: true })
    tags: any[] | null;

    @Column('uuid')
    created_by_id: string;

    @Column('uuid', { nullable: true })
    updated_by_id: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date | null;

    // Relations
    @ManyToOne(() => Company, { lazy: true })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => Candidate, { lazy: true })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @ManyToOne(() => Job, { lazy: true })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @ManyToOne(() => User, { nullable: true, lazy: true })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @ManyToOne(() => User, { nullable: true, lazy: true })
    @JoinColumn({ name: 'updated_by_id' })
    updated_by: User;

    @OneToMany(() => SubmissionStatusHistory, (history) => history.submission)
    status_history: SubmissionStatusHistory[];
}
