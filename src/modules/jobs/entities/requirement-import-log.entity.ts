import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { JobRequirement } from './job-requirement.entity';
import { User } from '../../../auth/entities/user.entity';

@Entity('requirement_import_logs')
export class RequirementImportLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: true })
    job_requirement_id: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    import_source: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    import_method: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    email_from: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email_subject: string;

    @Column({ type: 'timestamp', nullable: true })
    email_received_date: Date;

    @Column({ type: 'text', nullable: true })
    raw_email_content: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    ecms_req_id_extracted: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    parse_status: string;

    @Column({ type: 'text', nullable: true })
    parse_errors: string;

    @Column({ type: 'integer', nullable: true })
    extracted_fields_count: number;

    @Column({ type: 'uuid', nullable: true })
    processed_by_user_id: string;

    @CreateDateColumn()
    processed_at: Date;

    @Column({ type: 'text', nullable: true })
    processing_notes: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    status: string;

    @Column({ type: 'boolean', nullable: true })
    is_duplicate: boolean;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    extra_metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => JobRequirement, (job) => job.importLogs, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'processed_by_user_id' })
    processedBy: User;
}
