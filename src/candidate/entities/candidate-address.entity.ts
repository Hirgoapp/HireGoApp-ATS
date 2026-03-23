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

@Entity('candidate_addresses')
@Index(['company_id'])
@Index(['candidate_id'])
export class CandidateAddress {
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

    @ManyToOne(() => Candidate, (candidate) => candidate.addresses, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'varchar', length: 50, nullable: true })
    address_type?: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    state?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    country?: string;

    @Column({ type: 'varchar', length: 15, nullable: true })
    pincode?: string;

    @Column({ type: 'text', nullable: true })
    document_path?: string;

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
