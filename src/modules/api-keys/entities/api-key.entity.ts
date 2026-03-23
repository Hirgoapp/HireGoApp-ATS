import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, DeleteDateColumn } from 'typeorm';

@Entity('api_keys')
@Index('IDX_api_keys_company_is_active', ['companyId', 'isActive'])
@Index('IDX_api_keys_key_hash', ['keyHash'])
export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @Column({ name: 'key_hash', type: 'varchar', length: 255, unique: true })
    keyHash: string;

    @Column({ name: 'key_preview', type: 'varchar', length: 20 })
    keyPreview: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'scopes', type: 'text', array: true, default: '{read,write}' })
    scopes: string[];

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
    lastUsedAt: Date | null;

    @Column({ name: 'created_by_id', type: 'uuid' })
    createdById: string;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt: Date | null;
}
