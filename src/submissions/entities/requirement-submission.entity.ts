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
import { JobRequirement } from '../../jobs/entities/job-requirement.entity';
import { User } from '../../auth/entities/user.entity';

/**
 * RequirementSubmission Entity
 * 
 * Table: requirement_submissions
 * Matches PostgreSQL schema exactly
 * PK: id (INTEGER, auto-increment)
 * 
 * CRITICAL CHANGES:
 * - Table renamed from "submissions" to "requirement_submissions"
 * - NO candidate_id foreign key (database doesn't have it)
 * - Database uses DENORMALIZED candidate data in each submission record
 *   (candidate_name, candidate_email, candidate_phone, etc.)
 * - Links job_requirement_id (FK to job_requirements, NOT NULL)
 * - 32 fields total to track complete submission lifecycle
 * 
 * Note: This table embeds candidate data directly because submissions
 * can be created from email or CSV imports without a candidate record
 */
@Entity('requirement_submissions')
@Index(['job_requirement_id'])
@Index(['submission_status'])
@Index(['created_at'])
export class RequirementSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer' })
    job_requirement_id: number; // FK to job_requirements (NOT NULL)

    @Column({ type: 'integer', nullable: true })
    daily_submission_id: number;

    @Column({ type: 'date' })
    profile_submission_date: Date;

    // Vendor Information
    @Column({ type: 'varchar', length: 255, nullable: true })
    vendor_email_id: string;

    // DENORMALIZED CANDIDATE DATA
    // (These fields embed candidate information directly in the submission)
    @Column({ type: 'varchar', length: 255, nullable: true })
    candidate_title: string;

    @Column({ type: 'varchar', length: 255 })
    candidate_name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    candidate_phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    candidate_email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    candidate_notice_period: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    candidate_current_location: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    candidate_location_applying_for: string;

    @Column({ type: 'numeric', nullable: true })
    candidate_total_experience: number;

    @Column({ type: 'numeric', nullable: true })
    candidate_relevant_experience: number;

    @Column({ type: 'text', nullable: true })
    candidate_skills: string; // Comma-separated

    @Column({ type: 'numeric', nullable: true })
    vendor_quoted_rate: number;

    // Interview Details
    @Column({ type: 'text', nullable: true })
    interview_screenshot_url: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    interview_platform: string;

    @Column({ type: 'integer', nullable: true })
    screenshot_duration_minutes: number;

    // Candidate Background
    @Column({ type: 'varchar', length: 100, nullable: true })
    candidate_visa_type: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    candidate_engagement_type: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    candidate_ex_infosys_employee_id: string;

    // Submission Tracking
    @Column({ type: 'integer', nullable: true })
    submitted_by_user_id: number;

    @Column({ type: 'timestamp', default: () => 'now()' })
    submitted_at: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    submission_status: string; // Pending, Approved, Rejected, etc.

    @Column({ type: 'timestamp', nullable: true })
    status_updated_at: Date;

    // Feedback
    @Column({ type: 'text', nullable: true })
    client_feedback: string;

    @Column({ type: 'timestamp', nullable: true })
    client_feedback_date: Date;

    // Audit
    @Column({ type: 'jsonb', default: '{}' })
    extra_fields: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'integer', nullable: true })
    created_by: number;

    @Column({ type: 'integer', nullable: true })
    updated_by: number;

    // Relations
    @ManyToOne(() => JobRequirement)
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedByUser: User;
}
