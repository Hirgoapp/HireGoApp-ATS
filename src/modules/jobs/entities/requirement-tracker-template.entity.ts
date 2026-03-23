import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { JobRequirement } from './job-requirement.entity';

@Entity('requirement_tracker_templates')
export class RequirementTrackerTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: true })
    job_requirement_id: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tracker_source: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    tracker_type: string;

    @Column({ type: 'jsonb', nullable: true, default: [] })
    columns: any[];

    @Column({ type: 'integer', nullable: true })
    total_columns: number;

    @Column({ type: 'jsonb', nullable: true })
    column_mapping: Record<string, any>;

    @Column({ type: 'boolean', nullable: true, default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => JobRequirement, (job) => job.trackerTemplates, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;
}
