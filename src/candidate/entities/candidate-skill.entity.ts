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
import { Candidate } from './candidate.entity';

@Entity('candidate_skills')
@Index(['company_id'])
@Index(['candidate_id'])
@Index(['skill_id'])
export class CandidateSkill {
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

    @ManyToOne(() => Candidate, (candidate) => candidate.skills, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'uuid' })
    @Index()
    skill_id: string;

    @Column({ type: 'integer', nullable: true })
    proficiency?: number;

    @Column({ type: 'numeric', nullable: true })
    years_of_experience?: number;

    @Column({ type: 'boolean', nullable: true, default: false })
    certified?: boolean;

    @Column({ type: 'varchar', length: 20, nullable: true })
    hands_on_level?: string;

    @Column({ type: 'date', nullable: true })
    last_used?: Date;

    @Column({ type: 'integer', nullable: true })
    relevant_years?: number;

    @Column({ type: 'integer', nullable: true })
    relevant_months?: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
