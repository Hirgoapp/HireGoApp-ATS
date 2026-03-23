import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';

export enum NotificationType {
    APPLICATION_CREATED = 'application.created',
    APPLICATION_STAGE_CHANGED = 'application.stage_changed',
    APPLICATION_REJECTED = 'application.rejected',
    APPLICATION_HIRED = 'application.hired',
    CANDIDATE_ASSIGNED = 'candidate.assigned',
    INTERVIEW_SCHEDULED = 'interview.scheduled',
    INTERVIEW_REMINDER = 'interview.reminder',
    EVALUATION_REQUESTED = 'evaluation.requested',
    COMMENT_MENTIONED = 'comment.mentioned',
    TEAM_MEMBER_INVITED = 'team.member_invited',
    JOB_PUBLISHED = 'job.published',
    JOB_CLOSED = 'job.closed',
}

@Entity('notifications')
@Index(['company_id', 'user_id', 'created_at'])
@Index(['user_id', 'is_read'])
@Index(['entity_type', 'entity_id'])
@Index(['type'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column('uuid')
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 100 })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column('text')
    message: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    link?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    entity_type?: string;

    @Column({ type: 'uuid', nullable: true })
    entity_id?: string;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    read_at?: Date;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    metadata?: Record<string, any>;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
