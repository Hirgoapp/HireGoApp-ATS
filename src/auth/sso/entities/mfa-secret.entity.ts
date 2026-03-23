import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../entities/user.entity';

@Entity('mfa_secrets')
@Index(['user_id'])
export class MfaSecret {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    secret: string; // Encrypted TOTP secret

    @Column({ default: false })
    is_enabled: boolean;

    @Column({ default: false })
    is_verified: boolean;

    @Column({ type: 'jsonb', nullable: true })
    backup_codes: string[]; // Encrypted backup codes

    @Column({ type: 'int', default: 0 })
    used_backup_codes_count: number;

    @Column({ nullable: true })
    last_used_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @Column({ nullable: true })
    verified_at: Date;
}
