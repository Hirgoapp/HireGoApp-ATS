import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('api_key_usage')
@Index('IDX_api_key_usage_company_created', ['companyId', 'createdAt'])
@Index('IDX_api_key_usage_key_created', ['apiKeyId', 'createdAt'])
export class ApiKeyUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @Column({ name: 'api_key_id', type: 'uuid' })
    apiKeyId: string;

    @ManyToOne(() => ApiKey, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'api_key_id' })
    apiKey: ApiKey;

    @Column({ name: 'path', type: 'varchar', length: 500, nullable: true })
    path: string | null;

    @Column({ name: 'method', type: 'varchar', length: 10, nullable: true })
    method: string | null;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string | null;

    @Column({ name: 'status_code', type: 'integer', nullable: true })
    statusCode: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
