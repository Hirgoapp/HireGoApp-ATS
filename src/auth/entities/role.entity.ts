import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

/**
 * Role Entity
 * 
 * Table: roles
 * Matches multi-tenant PostgreSQL schema:
 * - PK: id (UUID)
 * - company_id: tenant identifier (nullable for system roles)
 * - is_system: true for global/template roles
 * - is_default: per-tenant default role
 * - soft-delete capable via deleted_at
 */
@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    company_id: string | null;

    @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'company_id' })
    company: Company | null;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Index()
    @Column({ type: 'varchar', length: 50 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'boolean', default: false })
    is_system: boolean;

    @Column({ type: 'boolean', default: false })
    is_default: boolean;

    @Column({ type: 'int', default: 0 })
    display_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date | null;
}