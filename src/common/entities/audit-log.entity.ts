import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('audit_logs')
@Index('IDX_audit_logs_company_entity_created', ['companyId', 'entityType', 'createdAt'])
@Index('IDX_audit_logs_company_user_created', ['companyId', 'userId', 'createdAt'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    // Note: DB migration uses uuid for user_id; map as string
    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string | null;

    @Column({ name: 'entity_type', type: 'varchar', length: 100 })
    entityType: string;

    @Column({ name: 'entity_id', type: 'uuid' })
    entityId: string;

    @Column({ name: 'action', type: 'varchar', length: 50 })
    action: string;

    @Column({ name: 'old_values', type: 'jsonb', nullable: true })
    oldValues: Record<string, any> | null;

    @Column({ name: 'new_values', type: 'jsonb', nullable: true })
    newValues: Record<string, any> | null;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string | null;

    @Column({ name: 'request_path', type: 'varchar', length: 500, nullable: true })
    requestPath: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}