import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { WebhookLog } from './webhook-log.entity';

export enum WebhookEventType {
    APPLICATION_CREATED = 'application.created',
    APPLICATION_STAGE_CHANGED = 'application.stage_changed',
    APPLICATION_REJECTED = 'application.rejected',
    APPLICATION_HIRED = 'application.hired',
    CANDIDATE_CREATED = 'candidate.created',
    CANDIDATE_UPDATED = 'candidate.updated',
    JOB_PUBLISHED = 'job.published',
    JOB_CLOSED = 'job.closed',
    INTERVIEW_SCHEDULED = 'interview.scheduled',
    INTERVIEW_COMPLETED = 'interview.completed',
    EVALUATION_SUBMITTED = 'evaluation.submitted',
    OFFER_SENT = 'offer.sent',
}

export interface RetryConfig {
    max_retries: number;
    retry_delay: number; // seconds
}

@Entity('webhook_subscriptions')
@Index('IDX_webhook_subscriptions_company_event', ['companyId', 'eventType'])
@Index('IDX_webhook_subscriptions_company_active', ['companyId', 'isActive'])
export class WebhookSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'event_type', type: 'varchar', length: 100 })
    eventType: WebhookEventType;

    @Column({ name: 'target_url', type: 'varchar', length: 500 })
    targetUrl: string;

    @Column({ type: 'varchar', length: 255 })
    secret: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'retry_config', type: 'jsonb', default: '{"max_retries": 3, "retry_delay": 60}' })
    retryConfig: RetryConfig;

    @Column({ type: 'jsonb', nullable: true })
    headers: Record<string, string>;

    @OneToMany(() => WebhookLog, log => log.subscription)
    logs: WebhookLog[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
    deletedAt: Date;
}
