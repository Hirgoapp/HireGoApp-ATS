import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { CandidateSkill } from './candidate-skill.entity';
import { CandidateEducation } from './candidate-education.entity';
import { CandidateExperience } from './candidate-experience.entity';
import { CandidateDocument } from './candidate-document.entity';
import { CandidateAddress } from './candidate-address.entity';
import { CandidateHistory } from './candidate-history.entity';
import { CandidateAttachment } from './candidate-attachment.entity';

@Entity('candidates')
@Index(['company_id'])
@Index(['email'])
@Index(['phone'])
@Index(['candidate_status'])
@Index(['source_id'])
@Index(['recruiter_id'])
@Index(['company_id', 'candidate_status'])
export class Candidate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 100 })
    candidate_name: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    email: string;

    @Column({ type: 'varchar', length: 20 })
    @Index()
    phone: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    gender?: string;

    @Column({ type: 'date', nullable: true })
    dob?: Date;

    @Column({ type: 'varchar', length: 20, nullable: true })
    marital_status?: string;

    @Column({ type: 'text', nullable: true })
    current_company?: string;

    @Column({ type: 'numeric', nullable: true })
    total_experience?: number;

    @Column({ type: 'numeric', nullable: true })
    relevant_experience?: number;

    @Column({ type: 'numeric', nullable: true })
    current_ctc?: number;

    @Column({ type: 'numeric', nullable: true })
    expected_ctc?: number;

    @Column({ type: 'varchar', length: 3, nullable: true, default: 'INR' })
    currency_code?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    notice_period?: string;

    @Column({ type: 'boolean', nullable: true, default: false })
    willing_to_relocate?: boolean;

    @Column({ type: 'boolean', nullable: true, default: false })
    buyout?: boolean;

    @Column({ type: 'text', nullable: true })
    reason_for_job_change?: string;

    @Column({ type: 'text', nullable: true })
    skill_set?: string;

    @Column({ type: 'uuid', nullable: true })
    current_location_id?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location_preference?: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'Active' })
    @Index()
    candidate_status?: string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    source_id?: string;

    @Column({ type: 'timestamp', nullable: true })
    last_contacted_date?: Date;

    @Column({ type: 'date', nullable: true })
    last_submission_date?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    extra_fields?: Record<string, any>;

    @Column({ type: 'varchar', length: 50, nullable: true })
    aadhar_number?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    uan_number?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    linkedin_url?: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'Pending' })
    manager_screening_status?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    client_name?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    highest_qualification?: string;

    @Column({ type: 'date', nullable: true })
    submission_date?: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    job_location?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    source?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    client?: string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    recruiter_id?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'recruiter_id' })
    recruiter?: User;

    @Column({ type: 'date', nullable: true })
    @Index()
    date_of_entry?: Date;

    @Column({ type: 'varchar', length: 50, nullable: true })
    manager_screening?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    resume_parser_used?: string;

    @Column({ type: 'numeric', nullable: true })
    extraction_confidence?: number;

    @Column({ type: 'timestamp', nullable: true })
    extraction_date?: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    resume_source_type?: string;

    @Column({ type: 'boolean', nullable: true, default: false })
    is_suspicious?: boolean;

    @Column({ type: 'uuid', nullable: true })
    cv_portal_id?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    import_batch_id?: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Column({ type: 'uuid', nullable: true })
    created_by?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    creator?: User;

    @Column({ type: 'uuid', nullable: true })
    updated_by?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updater?: User;

    // Relations
    @OneToMany(() => CandidateSkill, (skill) => skill.candidate)
    skills: CandidateSkill[];

    @OneToMany(() => CandidateEducation, (education) => education.candidate)
    education: CandidateEducation[];

    @OneToMany(() => CandidateExperience, (experience) => experience.candidate)
    experience: CandidateExperience[];

    @OneToMany(() => CandidateDocument, (document) => document.candidate)
    documents: CandidateDocument[];

    @OneToMany(() => CandidateAddress, (address) => address.candidate)
    addresses: CandidateAddress[];

    @OneToMany(() => CandidateHistory, (history) => history.candidate)
    history: CandidateHistory[];

    @OneToMany(() => CandidateAttachment, (attachment) => attachment.candidate)
    attachments: CandidateAttachment[];
}
