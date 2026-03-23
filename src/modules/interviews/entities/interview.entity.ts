import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { InterviewInterviewer } from './interview-interviewer.entity';
import { InterviewFeedback } from './interview-feedback.entity';
import { InterviewStatusHistory } from './interview-status-history.entity';

export enum InterviewStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    RESCHEDULED = 'rescheduled',
    NO_SHOW = 'no_show',
}

export enum InterviewMode {
    ONLINE = 'online',
    OFFLINE = 'offline',
    PHONE = 'phone',
}

export enum InterviewRound {
    SCREENING = 'screening',
    FIRST = 'first',
    SECOND = 'second',
    THIRD = 'third',
    FINAL = 'final',
    HR = 'hr',
    TECHNICAL = 'technical',
}

export enum InterviewType {
    PHONE = 'phone',
    VIDEO = 'video',
    ONSITE = 'onsite',
    OTHER = 'other',
}

@Entity('interviews')
@Index('idx_interviews_company_status', ['company_id', 'status'])
@Index('idx_interviews_company_submission', ['company_id', 'submission_id'])
@Index('idx_interviews_schedule', ['company_id', 'scheduled_start', 'scheduled_end'])
export class Interview {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    company_id: string;

    @Column({ type: 'uuid' })
    submission_id: string;

    @Column({ type: 'enum', enum: InterviewStatus, enumName: 'interviews_status_enum', default: InterviewStatus.SCHEDULED })
    status: InterviewStatus;

    @Column({ type: 'enum', enum: InterviewRound, enumName: 'interviews_round_enum' })
    round: InterviewRound;

    @Column({ type: 'date' })
    scheduled_date: string;

    @Column({ type: 'time' })
    scheduled_time: string;

    @Column({ type: 'uuid' })
    interviewer_id: string;

    @Column({ type: 'enum', enum: InterviewMode, enumName: 'interviews_mode_enum' })
    mode: InterviewMode;

    @Column({ type: 'timestamptz', nullable: true })
    scheduled_start: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    scheduled_end: Date | null;

    @Column({ type: 'text', nullable: true })
    location: string | null;

    @Column({ name: 'meeting_link', type: 'text', nullable: true })
    location_or_link: string | null;

    @Column({ name: 'feedback', type: 'text', nullable: true })
    feedback_text: string | null;

    @Column({ type: 'numeric', nullable: true })
    score: string | null;

    @Column({ type: 'text', nullable: true })
    remarks: string | null;

    @Column({ type: 'uuid', nullable: true })
    application_id: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    interview_type: InterviewType | string | null;

    @Column({ type: 'timestamp', nullable: true })
    scheduled_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date | null;

    @Column({ type: 'integer', nullable: true })
    duration_minutes: number | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any> | null;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @Column({ type: 'uuid', nullable: true })
    updated_by_id: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date | null;

    @OneToMany(() => InterviewInterviewer, (ii) => (ii as any).interview)
    interviewers: InterviewInterviewer[];

    @OneToMany(() => InterviewFeedback, (fb) => (fb as any).interview)
    feedback: InterviewFeedback[];

    @OneToMany(() => InterviewStatusHistory, (h) => (h as any).interview)
    status_history: InterviewStatusHistory[];
}
