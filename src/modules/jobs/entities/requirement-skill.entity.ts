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
import { JobRequirement } from './job-requirement.entity';

@Entity('requirement_skills')
@Index('idx_requirement_skills_job_req_id', ['job_requirement_id'])
@Index('idx_requirement_skills_company_job_req', ['company_id', 'job_requirement_id'])
export class RequirementSkill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: false })
    job_requirement_id: string;

    @Column({ type: 'uuid', nullable: false })
    skill_id: string;

    @Column({ type: 'boolean', nullable: true })
    is_mandatory: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    proficiency_required: string;

    @Column({ type: 'numeric', nullable: true })
    years_required: number;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => JobRequirement, (job) => job.skills, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;
}
