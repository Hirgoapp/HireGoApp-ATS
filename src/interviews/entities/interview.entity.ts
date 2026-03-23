import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Submission } from '../../modules/submissions/entities/submission.entity';
import { JobRequirement } from '../../jobs/entities/job-requirement.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { User } from '../../auth/entities/user.entity';

export enum InterviewMode {
    ONLINE = 'Online',
    OFFLINE = 'Offline',
    PHONE = 'Phone',
}

export enum InterviewRound {
    SCREENING = 'Screening',
    FIRST_ROUND = 'First Round',
    SECOND_ROUND = 'Second Round',
    THIRD_ROUND = 'Third Round',
    HR = 'HR',
    TECHNICAL = 'Technical',
}

export enum InterviewStatus {
    SCHEDULED = 'Scheduled',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    RESCHEDULED = 'Rescheduled',
    NO_SHOW = 'No Show',
    IN_PROGRESS = 'In Progress',
}

@Entity('interviews')
@Index(['company_id'])
@Index(['company_id', 'submission_id'])
@Index(['company_id', 'interviewer_id'])
@Index(['company_id', 'status'])
@Index(['company_id', 'scheduled_date'])
export class Interview {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'uuid', nullable: false })
    submission_id: string;

    @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @Column({ type: 'uuid', nullable: false })
    job_requirement_id: string;

    @ManyToOne(() => JobRequirement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;

    @Column({ type: 'uuid', nullable: true })
    candidate_id: string;

    @ManyToOne(() => Candidate, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({
        type: 'enum',
        enum: InterviewRound,
        default: InterviewRound.FIRST_ROUND,
    })
    round: InterviewRound;

    @Column('date', { nullable: true })
    scheduled_date: string;

    @Column('time', { nullable: true })
    scheduled_time: string;

    @Column({ type: 'uuid', nullable: true })
    interviewer_id: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'interviewer_id' })
    interviewer: User;

    @Column({
        type: 'enum',
        enum: InterviewMode,
        default: InterviewMode.ONLINE,
    })
    mode: InterviewMode;

    @Column({
        type: 'enum',
        enum: InterviewStatus,
        default: InterviewStatus.SCHEDULED,
    })
    status: InterviewStatus;

    @Column('decimal', { precision: 3, scale: 1, nullable: true })
    rating: number;

    @Column('text', { nullable: true })
    feedback: string;

    @Column('text', { nullable: true })
    outcome: string;

    @Column('text', { nullable: true })
    candidate_notes: string;

    @Column('text', { nullable: true })
    remarks: string;

    @Column('text', { nullable: true })
    location: string;

    @Column('text', { nullable: true })
    meeting_link: string;

    @Column('text', { nullable: true })
    reschedule_reason: string;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' })
    updatedByUser: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date;
}
