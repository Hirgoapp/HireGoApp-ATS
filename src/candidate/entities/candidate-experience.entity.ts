import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Candidate } from './candidate.entity';

@Entity('candidate_experience')
@Index(['company_id'])
@Index(['candidate_id'])
export class CandidateExperience {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'uuid' })
    @Index()
    candidate_id: string;

    @ManyToOne(() => Candidate, (candidate) => candidate.experience, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'varchar', length: 255 })
    company_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    job_title?: string;

    @Column({ type: 'date', nullable: true })
    start_date?: Date;

    @Column({ type: 'date', nullable: true })
    end_date?: Date;

    @Column({ type: 'boolean', nullable: true, default: false })
    is_current?: boolean;

    @Column({ type: 'text', nullable: true })
    remarks?: string;

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
}
