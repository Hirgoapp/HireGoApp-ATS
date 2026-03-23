import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { WebhookSubscription } from './webhook-subscription.entity';

export enum WebhookDeliveryStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    RETRYING = 'retrying',
}

@Entity('webhook_logs')
@Index('IDX_webhook_logs_company_subscription_created', ['companyId', 'subscriptionId', 'createdAt'])
@Index('IDX_webhook_logs_status', ['status'])
@Index('IDX_webhook_logs_next_retry', ['nextRetryAt'])
export class WebhookLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'subscription_id', type: 'uuid' })
    subscriptionId: string;

    @ManyToOne(() => WebhookSubscription, subscription => subscription.logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subscription_id' })
    subscription: WebhookSubscription;

    @Column({ name: 'event_type', type: 'varchar', length: 100 })
    eventType: string;

    @Column({ type: 'jsonb' })
    payload: any;

    @Column({ type: 'varchar', length: 50 })
    status: WebhookDeliveryStatus;

    @Column({ name: 'http_status', type: 'integer', nullable: true })
    httpStatus: number;

    @Column({ name: 'response_body', type: 'text', nullable: true })
    responseBody: string;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @Column({ name: 'retry_count', type: 'integer', default: 0 })
    retryCount: number;

    @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
    nextRetryAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
