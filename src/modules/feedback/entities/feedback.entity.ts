import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../../auth/entities/user.entity';
import { Company } from '../../../companies/entities/company.entity';

export enum FeedbackType {
    BUG = 'bug',
    FEATURE_REQUEST = 'feature_request',
    IMPROVEMENT = 'improvement',
    GENERAL = 'general',
    PRAISE = 'praise',
    COMPLAINT = 'complaint',
}

export enum FeedbackPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum FeedbackStatus {
    NEW = 'new',
    REVIEWING = 'reviewing',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    WONT_FIX = 'wont_fix',
    DUPLICATE = 'duplicate',
}

@Entity('feedback')
@Index(['company_id', 'status'])
@Index(['user_id', 'created_at'])
@Index(['type', 'priority', 'status'])
export class Feedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'enum', enum: FeedbackType })
    type: FeedbackType;

    @Column({ type: 'enum', enum: FeedbackPriority, default: FeedbackPriority.MEDIUM })
    priority: FeedbackPriority;

    @Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.NEW })
    status: FeedbackStatus;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text', nullable: true })
    reproduction_steps: string; // For bugs

    @Column({ type: 'text', nullable: true })
    expected_behavior: string; // For bugs

    @Column({ type: 'text', nullable: true })
    actual_behavior: string; // For bugs

    @Column({ type: 'varchar', nullable: true })
    page_url: string; // Page where feedback was submitted

    @Column({ type: 'varchar', nullable: true })
    browser: string;

    @Column({ type: 'varchar', nullable: true })
    os: string;

    @Column({ type: 'varchar', nullable: true })
    app_version: string;

    @Column({ type: 'jsonb', nullable: true })
    attachments: Array<{
        url: string;
        type: string;
        name: string;
    }>;

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        feature_flag?: string; // If related to a specific feature flag
        module?: string; // candidates, jobs, applications, etc.
        session_id?: string;
    };

    @Column({ type: 'text', nullable: true })
    admin_notes: string; // Internal notes from admin

    @Column({ type: 'text', nullable: true })
    resolution_notes: string; // Notes when marking as resolved

    @Column({ type: 'uuid', nullable: true })
    assigned_to: string; // Admin user assigned to handle this

    @Column({ type: 'timestamp', nullable: true })
    resolved_at: Date;

    @Column({ type: 'uuid', nullable: true })
    resolved_by: string;

    @Column({ type: 'int', default: 0 })
    upvotes: number; // Other users can upvote feedback

    @Column({ type: 'boolean', default: false })
    is_beta_feedback: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
