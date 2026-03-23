import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { Submission } from './submission.entity';
import { User } from '../../../auth/entities/user.entity';

@Entity('submission_documents')
export class SubmissionDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: false })
    submission_id: string;

    @Column({ type: 'uuid', nullable: true })
    document_type_id: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    document_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    file_name: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    file_path: string;

    @Column({ type: 'integer', nullable: true })
    file_size: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    mime_type: string;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    // Relations
    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    creator: User;
}
