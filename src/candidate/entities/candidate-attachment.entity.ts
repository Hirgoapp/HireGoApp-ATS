import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Candidate } from './candidate.entity';

@Entity('candidate_attachments')
@Index(['company_id'])
@Index(['candidate_id'])
export class CandidateAttachment {
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

    @ManyToOne(() => Candidate, (candidate) => candidate.attachments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate: Candidate;

    @Column({ type: 'varchar', length: 50 })
    doc_type: string;

    @Column({ type: 'varchar', length: 255 })
    filename: string;

    @Column({ type: 'varchar', length: 500 })
    file_path: string;

    @Column({ type: 'integer', nullable: true })
    file_size?: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    mime_type?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    uploaded_at: Date;

    @Column({ type: 'uuid', nullable: true })
    uploaded_by?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'uploaded_by' })
    uploader?: User;
}
