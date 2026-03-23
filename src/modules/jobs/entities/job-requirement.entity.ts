import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
    DeleteDateColumn,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';
import { RequirementSkill } from './requirement-skill.entity';
import { RequirementAssignment } from './requirement-assignment.entity';
import { RequirementImportLog } from './requirement-import-log.entity';
import { RequirementTrackerTemplate } from './requirement-tracker-template.entity';

@Entity('job_requirements')
@Index('idx_job_requirements_company_status', ['company_id', 'status'])
@Index('idx_job_requirements_company_poc', ['company_id', 'poc_id'])
export class JobRequirement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    ecms_req_id: string;

    @Column({ type: 'uuid', nullable: false })
    client_id: string;

    @Column({ type: 'uuid', nullable: true })
    poc_id: string | null;

    @Column({ type: 'varchar', length: 255, nullable: false })
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

    @Column({ type: 'text', nullable: false })
    mandatory_skills: string;

    @Column({ type: 'text', nullable: true })
    desired_skills: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    country: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    work_location: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    wfo_wfh_hybrid: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    shift_time: string;

    @Column({ type: 'integer', nullable: true })
    number_of_openings: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    project_manager_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    project_manager_email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_spoc_1_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_spoc_1_email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_spoc_2_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_spoc_2_email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    bgv_timing: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    bgv_vendor: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    interview_mode: string;

    @Column({ type: 'text', nullable: true })
    interview_platforms: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    screenshot_requirement: string;

    @Column({ type: 'numeric', nullable: true })
    vendor_rate: number;

    @Column({ type: 'varchar', length: 3, nullable: true })
    currency: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    client_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email_subject: string;

    @Column({ type: 'timestamp', nullable: true })
    email_received_date: Date;

    @Column({ type: 'varchar', length: 20, nullable: false, default: 'Medium' })
    priority: string;

    @Column({ type: 'boolean', nullable: true, default: true })
    active_flag: boolean;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    extra_fields: Record<string, any>;

    @Column({ type: 'varchar', length: 50, nullable: false, default: 'open' })
    status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updater: User;

    @OneToMany(() => RequirementSkill, (skill) => skill.jobRequirement)
    skills: RequirementSkill[];

    @OneToMany(() => RequirementAssignment, (assignment) => assignment.jobRequirement)
    assignments: RequirementAssignment[];

    @OneToMany(() => RequirementImportLog, (log) => log.jobRequirement)
    importLogs: RequirementImportLog[];

    @OneToMany(() => RequirementTrackerTemplate, (template) => template.jobRequirement)
    trackerTemplates: RequirementTrackerTemplate[];
}
