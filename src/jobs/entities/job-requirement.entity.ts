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
import { Client } from '../../companies/entities/client.entity';
import { User } from '../../auth/entities/user.entity';

/**
 * JobRequirement Entity (formerly "Job")
 * 
 * Table: job_requirements
 * Matches PostgreSQL schema exactly
 * PK: id (INTEGER, auto-increment)
 * 
 * CRITICAL CHANGES:
 * - Table name changed from "jobs" to "job_requirements"
 * - company_id removed, replaced with client_id (FK to clients table)
 * - Added ecms_req_id as unique external reference
 * - Added 20+ fields: wfo_wfh_hybrid, bgv_*, interview_platforms, vendor_rate, etc.
 * - Priority enum: Low, Medium, High (NOT lowercase)
 * - 35 total fields to match DB exactly
 */
@Entity('job_requirements')
@Index(['client_id'])
@Index(['ecms_req_id'])
@Index(['active_flag'])
@Index(['created_at'])
export class JobRequirement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    ecms_req_id: string; // External reference

    @Column({ type: 'integer' })
    client_id: number;

    @Column({ type: 'varchar', length: 255 })
    job_title: string;

    @Column({ type: 'text', nullable: true })
    job_description: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    domain: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    business_unit: string;

    @Column({ type: 'integer', nullable: true })
    total_experience_min: number;

    @Column({ type: 'integer', nullable: true })
    relevant_experience_min: number;

    @Column({ type: 'text', default: 'N/A' })
    mandatory_skills: string; // Comma-separated

    @Column({ type: 'text', nullable: true })
    desired_skills: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    country: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    work_location: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    wfo_wfh_hybrid: string; // WFO, WFH, Hybrid

    @Column({ type: 'varchar', length: 100, nullable: true })
    shift_time: string;

    @Column({ type: 'integer', nullable: true })
    number_of_openings: number;

    // Project Contacts
    @Column({ type: 'varchar', length: 255, nullable: true })
    project_manager_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    project_manager_email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_spoc_1_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_spoc_1_email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_spoc_2_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_spoc_2_email: string;

    // Background Verification
    @Column({ type: 'varchar', length: 100, nullable: true })
    bgv_timing: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    bgv_vendor: string;

    // Interview Details
    @Column({ type: 'varchar', length: 100, nullable: true })
    interview_mode: string;

    @Column({ type: 'text', nullable: true })
    interview_platforms: string; // Comma-separated

    @Column({ type: 'varchar', length: 100, nullable: true })
    screenshot_requirement: string;

    // Vendor/Rate Information
    @Column({ type: 'numeric', nullable: true })
    vendor_rate: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    currency: string;

    // Denormalized (redundant but in DB)
    @Column({ type: 'varchar', length: 255, nullable: true })
    client_name: string;

    // Email Details
    @Column({ type: 'varchar', length: 255, nullable: true })
    email_subject: string;

    @Column({ type: 'timestamp', nullable: true })
    email_received_date: Date;

    // Status & Control
    @Column({ type: 'boolean', default: true })
    active_flag: boolean;

    @Column({ type: 'varchar', length: 50, default: 'Medium' })
    priority: string; // Low, Medium, High

    @Column({ type: 'jsonb', default: '{}' })
    extra_fields: Record<string, any>;

    // Audit
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'integer', nullable: true })
    created_by: number;

    // Relations
    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;
}
