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

@Entity('candidate_documents')
@Index(['company_id'])
@Index(['candidate_id'])
export class CandidateDocument {
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

    @ManyToOne(() => Candidate, (candidate) => candidate.documents, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'varchar', length: 255, nullable: true })
    file_name?: string;

    @Column({ type: 'text', nullable: true })
    file_path?: string;

    @Column({ type: 'uuid', nullable: true })
    document_type_id?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    section_type?: string;

    @Column({ type: 'uuid', nullable: true })
    section_ref_id?: string;

    @Column({ type: 'boolean', nullable: true, default: false })
    verified?: boolean;

    @Column({ type: 'date', nullable: true })
    expiry_date?: Date;

    @Column({ type: 'text', nullable: true })
    remarks?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    uploaded_at: Date;

    @Column({ type: 'uuid', nullable: true })
    uploaded_by?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'uploaded_by' })
    uploader?: User;

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
