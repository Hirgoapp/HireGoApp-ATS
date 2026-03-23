import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { CreateDateColumn } from 'typeorm';
import { Submission } from './submission.entity';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';

@Entity('submission_histories')
@Index('idx_submission_histories_submission', ['submission_id', 'created_at'])
@Index('idx_submission_histories_company', ['company_id', 'created_at'])
export class SubmissionStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    submission_id: string;

    @Column('uuid')
    company_id: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    moved_from_stage: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    moved_to_stage: string | null;

    @Column({ type: 'text', nullable: true })
    reason: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    outcome_recorded: string | null;

    @Column({ type: 'text', nullable: true })
    outcome_reason: string | null;

    @Column('uuid')
    created_by_id: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    created_at: Date;

    // Relations
    @ManyToOne(() => Submission, (submission) => submission.status_history, {
        lazy: true,
    })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @ManyToOne(() => Company, { lazy: true })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => User, { nullable: true, lazy: true })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;
}
