import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('files')
@Index('idx_files_company_entity', ['company_id', 'entity_type', 'entity_id'])
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('varchar', { length: 100 })
    entity_type: string; // Candidate, Client, Job, Submission, etc.

    @Column('uuid')
    entity_id: string;

    @Column('varchar', { length: 255 })
    file_name: string;

    @Column('varchar', { length: 500 })
    file_url: string;

    @Column('int')
    file_size: number;

    @Column('varchar', { length: 100 })
    mime_type: string;

    @Column('varchar', { length: 50 })
    storage_provider: string; // local, s3, google_drive, onedrive

    @Column('uuid', { nullable: true })
    uploaded_by: string | null;

    @CreateDateColumn()
    created_at: Date;
}

