import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permission_audit')
@Index(['company_id', 'created_at'])
@Index(['user_id', 'created_at'])
export class RolePermissionAudit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string; // Tenant ID

    @Column('uuid', { nullable: true })
    user_id: string; // Who made this change

    // Change Details
    @Column('varchar', { length: 50 })
    action: string; // 'ROLE_CREATED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ROLE_ASSIGNED', etc

    @Column('uuid', { nullable: true })
    role_id: string;

    @Column('uuid', { nullable: true })
    permission_id: string;

    // Before/After state
    @Column('jsonb', { nullable: true })
    old_values: Record<string, any>;

    @Column('jsonb', { nullable: true })
    new_values: Record<string, any>;

    // Context
    @Column('text', { nullable: true })
    reason: string;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => Role, {
        onDelete: 'SET NULL',
        eager: false
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Permission, {
        onDelete: 'SET NULL',
        eager: false
    })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}
