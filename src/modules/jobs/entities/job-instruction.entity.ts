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
import { Company } from '../../../companies/entities/company.entity';
import { Job } from './job.entity';

/**
 * JobInstruction Entity
 * Stores client-specific instructions for job submissions
 * (Resume guidelines, interview rules, compliance requirements, etc.)
 */
@Entity('job_instructions')
@Index(['job_id', 'instruction_type'])
export class JobInstruction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    job_id: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 50 })
    instruction_type: string; // 'submission', 'interview', 'compliance', 'general'

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 20, default: 'text' })
    content_format: string; // 'text', 'html', 'markdown'

    @Column({ type: 'int', default: 0 })
    display_order: number;

    @Column({ type: 'boolean', default: true })
    is_mandatory: boolean;

    @Column({ type: 'varchar', length: 20, default: 'normal' })
    highlight_level: string; // 'critical', 'high', 'normal'

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
