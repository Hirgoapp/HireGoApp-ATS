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
import { User } from '../../../auth/entities/user.entity';

@Entity('requirement_assignments')
export class RequirementAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: false })
    job_requirement_id: string;

    @Column({ type: 'uuid', nullable: false })
    assigned_to_user_id: string;

    @Column({ type: 'uuid', nullable: true })
    assigned_by_user_id: string;

    @CreateDateColumn()
    assigned_at: Date;

    @Column({ type: 'text', nullable: true })
    assignment_notes: string;

    @Column({ type: 'integer', nullable: true })
    target_count: number;

    @Column({ type: 'date', nullable: true })
    target_submission_date: Date;

    @Column({ type: 'varchar', length: 50, nullable: true })
    status: string;

    @Column({ type: 'text', nullable: true })
    completion_notes: string;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => JobRequirement, (job) => job.assignments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_requirement_id' })
    jobRequirement: JobRequirement;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to_user_id' })
    assignedTo: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_by_user_id' })
    assignedBy: User;
}
