import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

@Entity('super_admin_users')
@Index(['email'])
@Index(['is_active'])
export class SuperAdminUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Personal Info
    @Column('varchar', { length: 100 })
    first_name: string;

    @Column('varchar', { length: 100 })
    last_name: string;

    @Column('varchar', { length: 255, unique: true })
    email: string;

    @Column('varchar', { length: 20, nullable: true })
    phone: string;

    // Auth
    @Column('varchar', { length: 255 })
    password_hash: string;

    // Access Control
    @Column('varchar', { length: 50, default: 'super_admin' })
    role: string; // super_admin, support, operations

    @Column('jsonb', { default: '{}' })
    permissions: Record<string, any>; // Custom permissions if needed

    // Account Status
    @Column('boolean', { default: true })
    is_active: boolean;

    @Column('boolean', { default: false })
    email_verified: boolean;

    @Column('timestamp', { nullable: true })
    last_login_at: Date;

    // Settings
    @Column('jsonb', { default: '{}' })
    preferences: Record<string, any>;

    // Metadata
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;
}
