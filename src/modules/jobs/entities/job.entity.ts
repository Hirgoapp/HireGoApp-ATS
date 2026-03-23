import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';
import { Pipeline } from '../../pipelines/entities/pipeline.entity';
import { Client } from './client.entity';
import { JobEmailSource } from './job-email-source.entity';

/**
 * Job Entity
 * Table: jobs
 * Multi-tenant ATS job postings
 */
@Entity('jobs')
@Index(['company_id'])
@Index(['company_id', 'status'])
@Index(['company_id', 'pipeline_id'])
export class Job {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    requirements: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    job_code: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    department: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    salary_min: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    salary_max: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    salary_currency: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    employment_type: string; // Full-time, Part-time, Contract, Temporary

    @Column({ type: 'varchar', length: 50, default: 'open' })
    status: string; // open, closed, on-hold, cancelled

    @Column({ type: 'uuid', nullable: true })
    pipeline_id: string;

    @ManyToOne(() => Pipeline, { nullable: true })
    @JoinColumn({ name: 'pipeline_id' })
    pipeline: Pipeline;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Column({ type: 'uuid', nullable: true })
    hiring_manager_id: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'hiring_manager_id' })
    hiring_manager: User;

    @Column({ type: 'jsonb', default: {} })
    custom_fields: Record<string, any>;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    // Additional fields
    @Column({ type: 'varchar', length: 50, nullable: true })
    level: string; // Junior, Mid, Senior, Lead, etc.

    @Column({ type: 'int', nullable: true })
    years_required: number;

    @Column({ type: 'varchar', length: 10, nullable: true })
    currency: string;

    @Column({ type: 'boolean', default: false })
    is_remote: boolean;

    @Column({ type: 'boolean', default: false })
    is_hybrid: boolean;

    @Column({ type: 'int', default: 1 })
    priority: number; // 1=Low, 2=Medium, 3=High

    @Column({ type: 'date', nullable: true })
    target_hire_date: Date;

    @Column({ type: 'int', default: 1 })
    openings: number; // Number of positions

    @Column({ type: 'jsonb', default: [] })
    required_skills: string[];

    @Column({ type: 'jsonb', default: [] })
    preferred_skills: string[];

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ type: 'text', nullable: true })
    internal_notes: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    source: string; // Posted manually, imported, etc.

    @Column({ type: 'uuid', nullable: true })
    updated_by_id: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by_id' })
    updated_by: User;

    // ============================================
    // DYNAMIC JD FIELDS (Flexible Format Support)
    // ============================================

    /**
     * Dynamic job description content
     * Supports multiple formats: plain text, markdown, HTML
     * Companies can paste their entire JD here with formatting
     */
    @Column({ type: 'text', nullable: true })
    jd_content: string;

    /**
     * Format of the JD content
     * Values: 'plain' | 'markdown' | 'html' | 'structured'
     */
    @Column({ type: 'varchar', length: 20, nullable: true, default: 'plain' })
    jd_format: string;

    /**
     * URL/path to uploaded JD file (PDF, DOCX, TXT)
     * Stored in cloud storage or local file system
     */
    @Column({ type: 'varchar', length: 500, nullable: true })
    jd_file_url: string;

    /**
     * Metadata about the uploaded file
     * { filename, size, mimeType, uploadedAt, extractedText }
     */
    @Column({ type: 'jsonb', nullable: true, default: {} })
    jd_file_metadata: Record<string, any>;

    /**
     * Parsed/structured sections from JD
     * [{ heading: 'Responsibilities', content: '...', order: 1 }, ...]
     * Can be extracted via AI or manual parsing
     */
    @Column({ type: 'jsonb', nullable: true, default: [] })
    jd_sections: Array<{
        heading: string;
        content: string;
        order: number;
        type?: string; // 'responsibilities', 'qualifications', 'benefits', etc.
    }>;

    /**
     * Flag to indicate whether to use dynamic JD or legacy structured fields
     * If true: use jd_content, jd_sections
     * If false: use description, requirements fields
     */
    @Column({ type: 'boolean', default: false })
    use_dynamic_jd: boolean;

    // ============================================
    // REQUIREMENT LIFECYCLE & CONTRACT STAFFING FIELDS
    // ============================================
    // This job record represents ONE VERSION of a client requirement.
    // Raw email in job_email_sources is the authoritative source.
    // These fields are extracted for indexing, searching, and UI display.
    // ============================================

    /**
     * Requirement lifecycle status
     * - open: Actively recruiting
     * - on_hold: Temporarily paused by client
     * - closed: No longer recruiting (candidates hired)
     * - cancelled: Requirement cancelled by client
     * - replaced: Superseded by a newer version (same ECMS Req ID)
     *
     * Versioning: When same ECMS Req ID is re-imported:
     * - Old job → requirement_status = replaced
     * - New job → requirement_status = open
     */
    @Column({ type: 'varchar', length: 50, default: 'open' })
    requirement_status: string;

    /**
     * Client company that sent the job requirement
     */
    @Column({ type: 'uuid', nullable: true })
    client_id: string;

    @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    /**
     * Client POC (Point of Contact) UUID
     */
    @Column({ type: 'uuid', nullable: true })
    poc_id: string;

    /**
     * Client's requirement ID (e.g., ECMS Req ID: 545390)
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @Index()
    client_req_id: string;

    /**
     * Client's project manager name
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    client_project_manager: string;

    /**
     * Delivery SPOC (Single Point of Contact)
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_spoc: string;

    /**
     * PU / Business Unit (e.g., EAISHIL)
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    pu_unit: string;

    /**
     * Vendor rate value (extracted from email)
     */
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    vendor_rate_value: number;

    /**
     * Vendor rate currency (e.g., INR, USD)
     */
    @Column({ type: 'varchar', length: 10, default: 'INR', nullable: true })
    vendor_rate_currency: string;

    /**
     * Vendor rate unit (hourly, daily, monthly)
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    vendor_rate_unit: string;

    /**
     * Raw vendor rate text as it appears in email
     * (e.g., "Up to INR 15000/Day")
     */
    @Column({ type: 'text', nullable: true })
    vendor_rate_text: string;

    /**
     * Interview mode (e.g., Client Interview/F2F, Telephonic, Video)
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    interview_mode: string;

    /**
     * Work mode (Hybrid, WFO, WFH)
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    work_mode: string;

    /**
     * Background check timing (Before onboarding, After onboarding)
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    background_check_timing: string;

    /**
     * Domain / Industry (e.g., Banking, Healthcare)
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    domain_industry: string;

    /**
     * Relevant experience requirement (e.g., "7+ years as Senior PEGA developer")
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    relevant_experience: string;

    /**
     * Desired/preferred skills (in addition to required_skills)
     */
    @Column({ type: 'text', array: true, nullable: true })
    desired_skills: string[];

    /**
     * Multiple work locations (e.g., Pune/Hyderabad/Bangalore PAN India)
     */
    @Column({ type: 'text', array: true, nullable: true })
    work_locations: string[];

    /**
     * Email address where candidate submissions should be sent
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    submission_email: string;

    /**
     * Link to the latest email source (raw email)
     */
    @Column({ type: 'uuid', nullable: true })
    email_source_id: string;

    @ManyToOne(() => JobEmailSource, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'email_source_id' })
    email_source: JobEmailSource;

    /**
     * Version number for requirement updates
     */
    @Column({ type: 'int', default: 1 })
    version: number;

    /**
     * Flag indicating if this is the latest version of the requirement
     */
    @Column({ type: 'boolean', default: true })
    is_latest_version: boolean;

    /**
     * Reference to original job if this is a versioned update
     */
    @Column({ type: 'uuid', nullable: true })
    original_job_id: string;

    // ============================================
    // EMAIL IMPORT FIELDS (Complete Email Data)
    // ============================================

    /**
     * Complete raw email content as received
     * Preserves all original formatting, tables, guidelines
     */
    @Column({ type: 'text', nullable: true })
    raw_email_content: string;

    /**
     * Client code extracted from subject (EAIS, HILDGTL, INS-ADM, etc.)
     */
    @Column({ type: 'varchar', length: 100, nullable: true })
    @Index()
    client_code: string;

    /**
     * Auto-extracted fields from email (JSONB)
     * Stores all fields that were successfully parsed
     */
    @Column({ type: 'jsonb', nullable: true })
    extracted_fields: Record<string, any>;

    /**
     * Candidate tracker format from email
     * { columns: [...], format: 'table' }
     */
    @Column({ type: 'jsonb', nullable: true })
    candidate_tracker_format: Record<string, any>;

    /**
     * Submission guidelines from email (text)
     * Screenshot requirements, platform rules, compliance notes
     */
    @Column({ type: 'text', nullable: true })
    submission_guidelines: string;

    /**
     * Additional JD metadata (JSONB)
     * { pu, projectManager, deliverySpoc, duration, shiftTime, etc. }
     */
    @Column({ type: 'jsonb', nullable: true })
    jd_metadata: Record<string, any>;

    // ============================================
    // SMART PARSING METADATA
    // ============================================

    /**
     * Raw content pasted by user for intelligent extraction
     * Stores the original unstructured text/email before AI processing
     */
    @Column({ type: 'text', nullable: true })
    parsed_content_raw: string;

    /**
     * AI extraction confidence score (0-1)
     * 0.9+ = High confidence, 0.5-0.9 = Medium, <0.5 = Low
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    extraction_confidence: number;

    /**
     * Which AI provider extracted this job
     * 'Sambanova', 'Gemini', 'Regex', 'Manual', etc.
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    extraction_provider: string;

    /**
     * Timestamp of when AI extraction occurred
     */
    @Column({ type: 'timestamp', nullable: true })
    extraction_timestamp: Date;
}
