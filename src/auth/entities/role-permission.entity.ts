import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    Index,
    Unique,
    JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Index(['role_id'])
@Index(['permission_id'])
@Unique(['role_id', 'permission_id'])
export class RolePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    role_id: string;

    @Column('uuid')
    permission_id: string;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => Role, {
        onDelete: 'CASCADE',
        eager: false
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Permission, {
        onDelete: 'CASCADE',
        eager: false
    })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}
