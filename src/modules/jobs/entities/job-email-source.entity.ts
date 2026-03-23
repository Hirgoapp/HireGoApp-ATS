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
import { Job } from './job.entity';
import { Client } from './client.entity';
import { User } from '../../../auth/entities/user.entity';

/**
 * JobEmailSource Entity
 * Stores raw email content and metadata for email-based job requirements
 * Supports versioning when same requirement is updated
 */
@Entity('job_email_sources')
@Index(['company_id', 'job_id'])
@Index(['client_req_id', 'is_latest'])
@Index(['client_id', 'received_date'])
export class JobEmailSource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'uuid', nullable: true })
    job_id: string;

    @ManyToOne(() => Job, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ type: 'uuid', nullable: true })
    client_id: string;

    @ManyToOne(() => Client, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    // Email Metadata
    @Column({ type: 'text', nullable: true })
    email_subject: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    sender_email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    sender_name: string;

    @Column({ type: 'timestamp', nullable: true })
    received_date: Date;

    @Column({ type: 'varchar', length: 500, nullable: true })
    email_thread_id: string; // For future email sync

    // Raw Content (Source of Truth)
    @Column({ type: 'text' })
    raw_email_content: string; // Complete email as pasted

    @Column({ type: 'text', nullable: true })
    raw_email_html: string; // HTML version if available

    @Column({ type: 'varchar', length: 20, default: 'text' })
    email_format: string; // 'text', 'html', 'mixed'

    // Parsing Results
    @Column({ type: 'varchar', length: 100, nullable: true })
    @Index()
    client_req_id: string; // ECMS Req ID / Client Reference

    @Column({ type: 'jsonb', default: {} })
    parsed_data: Record<string, any>; // Extracted fields

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    parsing_status: string; // 'pending', 'parsed', 'failed'

    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    parsing_confidence: number; // 0.00 to 1.00

    @Column({ type: 'jsonb', nullable: true })
    parsing_errors: Record<string, any>;

    /**
     * Email attachments metadata
     * Tracks files that were attached to the requirement email
     * Supports future file upload/storage integration
     * Example: [{filename: 'JD.pdf', size: 102400, mimeType: 'application/pdf'}]
     */
    @Column({ type: 'jsonb', default: [] })
    attachments_metadata: Array<{
        filename: string;
        size?: number;
        mimeType?: string;
        url?: string; // Future: S3/storage URL
        uploadedAt?: Date;
    }>;

    // Versioning
    @Column({ type: 'int', default: 1 })
    version: number;

    @Column({ type: 'boolean', default: true })
    @Index()
    is_latest: boolean;

    @Column({ type: 'uuid', nullable: true })
    superseded_by: string; // Links to newer version

    // Tracking
    @Column({ type: 'uuid', nullable: true })
    imported_by_id: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'imported_by_id' })
    imported_by: User;

    @Column({ type: 'timestamp', nullable: true })
    processed_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
