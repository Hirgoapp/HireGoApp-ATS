import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

/**
 * Permission Entity
 *
 * Global (non-tenant) permission definition.
 * Backed by the `permissions` table created in 1704067220000-CreatePermissionsTable.
 *
 * Canonical permission key:
 * - `key` maps to the underlying `name` column, e.g. "jobs:create"
 * - `resource` and `action` are stored separately for querying and grouping
 */
@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Canonical permission identifier, mapped to DB column `name`
    @Index({ unique: true })
    @Column({ name: 'name', type: 'varchar', length: 100 })
    key: string; // e.g., "jobs:create"

    @Index()
    @Column({ type: 'varchar', length: 50 })
    resource: string; // e.g., "jobs"

    @Index()
    @Column({ type: 'varchar', length: 50 })
    action: string; // e.g., "create"

    @Column({ type: 'text', nullable: true })
    description: string | null;

    // Soft enable/disable without deleting
    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    // Additional fields from existing schema (kept for compatibility)
    @Column({ type: 'int', default: 0 })
    level: number;

    @Column({ type: 'boolean', default: false })
    is_sensitive: boolean;

    @Column({ type: 'boolean', default: false })
    requires_mfa: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
