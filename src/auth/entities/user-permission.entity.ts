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
import { Permission } from './permission.entity';

@Entity('user_permissions')
@Index(['company_id', 'user_id'])
@Index(['expires_at'])
@Unique(['company_id', 'user_id', 'permission_id'])
export class UserPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string; // Tenant ID

    @Column('uuid')
    user_id: string; // Target user receiving override

    @Column('uuid')
    permission_id: string;

    // Override Type
    @Column('varchar', { length: 50 })
    grant_type: 'grant' | 'revoke'; // 'grant' (give), 'revoke' (remove)

    @Column('text', { nullable: true })
    reason: string; // Why this override exists

    // Metadata
    @CreateDateColumn()
    created_at: Date;

    @Column('uuid', { nullable: true })
    created_by_id: string; // Who created this override

    @Column('timestamp', { nullable: true })
    expires_at: Date; // Temporary override

    // Relations
    @ManyToOne(() => Permission, {
        onDelete: 'CASCADE',
        eager: false
    })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}
