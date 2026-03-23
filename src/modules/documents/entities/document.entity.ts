import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';

@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 50 })
    entity_type: string;

    @Column({ type: 'uuid' })
    entity_id: string;

    @Column({ type: 'varchar', length: 255 })
    file_name: string;

    @Column({ type: 'varchar', length: 255 })
    original_name: string;

    @Column({ type: 'varchar', length: 500 })
    file_path: string;

    @Column({ type: 'bigint' })
    file_size: number;

    @Column({ type: 'varchar', length: 100 })
    mime_type: string;

    @Column({ type: 'varchar', length: 50 })
    document_type: string;

    @Column({ type: 'varchar', length: 20, default: 'local' })
    storage_type: string;

    @Column({ type: 'text', nullable: true })
    extracted_text: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'boolean', default: false })
    is_public: boolean;

    @Column({ type: 'uuid', nullable: true })
    uploaded_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by' })
    uploader: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
