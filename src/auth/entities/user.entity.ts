import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';

@Entity('users')
@Index(['email'])
@Index(['company_id'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    // Username is not present in the current database schema; keep it non-persistent to avoid query errors
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: true,
        select: false,
        insert: false,
        update: false,
    })
    username?: string;

    // Hashed password column (persisted in database as password_hash)
    @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
    password_hash: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    department: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    is_active: boolean;

    @Column({ name: 'email_verified', type: 'boolean', default: false })
    email_verified: boolean;

    @Column({ type: 'jsonb', default: {} })
    permissions: Record<string, any>;

    @Column({ type: 'jsonb', default: {} })
    preferences: Record<string, any>;

    @Column({ name: 'role', type: 'varchar', length: 50, nullable: true })
    role: string;

    @Column({ type: 'timestamp', nullable: true })
    last_login_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations for audit/ownership
    @OneToMany(() => Candidate, (candidate) => candidate.creator)
    candidatesCreated: Candidate[];

    @OneToMany(() => Candidate, (candidate) => candidate.updater)
    candidatesUpdated: Candidate[];
}
