import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';
import { JobRequirement } from '../../jobs/entities/job-requirement.entity';
import { Pipeline } from '../../pipelines/entities/pipeline.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';
import { Source } from '../../sources/entities/source.entity';

export enum ApplicationStatus {
    ACTIVE = 'active',
    HIRED = 'hired',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
    ON_HOLD = 'on_hold',
}

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    company_id: string;

    @Column({ type: 'integer' })
    candidate_id: number;

    @Column({ type: 'integer' })
    job_id: number;

    @Column({ type: 'uuid' })
    pipeline_id: string;

    @Column({ type: 'uuid' })
    current_stage_id: string;

    @Column({ type: 'uuid', nullable: true })
    source_id: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    applied_at: Date;

    @Column({
        type: 'varchar',
        length: 50,
        default: ApplicationStatus.ACTIVE,
    })
    status: ApplicationStatus;

    @Column({ type: 'integer', nullable: true })
    rating: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'uuid', nullable: true })
    resume_file_id: string;

    @Column({ type: 'uuid', nullable: true })
    cover_letter_file_id: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({ type: 'uuid', nullable: true })
    assigned_to: string;

    @Column({ type: 'boolean', default: false })
    is_archived: boolean;

    @Column({ type: 'timestamp', nullable: true })
    archived_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    // Relations
    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => JobRequirement, { eager: true })
    @JoinColumn({ name: 'job_id' })
    job: JobRequirement;

    @ManyToOne(() => Pipeline)
    @JoinColumn({ name: 'pipeline_id' })
    pipeline: Pipeline;

    @ManyToOne(() => PipelineStage, { eager: true })
    @JoinColumn({ name: 'current_stage_id' })
    current_stage: PipelineStage;

    @ManyToOne(() => Source)
    @JoinColumn({ name: 'source_id' })
    source: Source;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to' })
    assignee: User;
}
