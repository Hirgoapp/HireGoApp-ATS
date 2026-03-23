import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Candidate } from './candidate.entity';

@Entity('candidate_history')
@Index(['company_id'])
@Index(['candidate_id'])
@Index(['handled_by'])
export class CandidateHistory {
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

    @ManyToOne(() => Candidate, (candidate) => candidate.history, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    handled_by?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'handled_by' })
    handler?: User;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    handled_on: Date;

    @Column({ type: 'text', nullable: true })
    action?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'uuid', nullable: true })
    skill_id?: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
