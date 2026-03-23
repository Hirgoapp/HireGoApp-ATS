import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { SuperAdminUser } from './super-admin-user.entity';

export enum SuperAdminInviteStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
}

@Entity('super_admin_invites')
@Index(['status', 'expires_at'])
@Index(['email'])
@Index(['company_id'])
export class SuperAdminInvite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 320 })
    email: string;

    /** Target tenant when inviting a company user; null when inviting another super admin. */
    @Column({ type: 'uuid', nullable: true })
    company_id: string | null;

    /** Denormalized company label for lists and emails (always set when company_id is set). */
    @Column({ type: 'varchar', length: 255, nullable: true })
    company_name: string | null;

    /**
     * Intended role after acceptance: super_admin | company_admin | admin | recruiter | hiring_manager, etc.
     */
    @Column({ type: 'varchar', length: 64 })
    role: string;

    @Column({ type: 'varchar', length: 24, default: SuperAdminInviteStatus.PENDING })
    status: SuperAdminInviteStatus;

    /** SHA-256 hex of the raw invitation token (never store plaintext token). */
    @Column({ type: 'varchar', length: 64, unique: true })
    token_hash: string;

    @Column({ type: 'timestamptz' })
    expires_at: Date;

    @Column({ type: 'uuid', nullable: true })
    invited_by_id: string | null;

    @ManyToOne(() => SuperAdminUser, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'invited_by_id' })
    invited_by: SuperAdminUser | null;

    @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'company_id' })
    company: Company | null;

    @Column({ type: 'timestamptz', nullable: true })
    accepted_at: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    revoked_at: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    last_sent_at: Date | null;

    @Column({ type: 'int', default: 0 })
    resent_count: number;

    @Column({ type: 'text', nullable: true })
    personal_message: string | null;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
