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
import { SsoConfiguration } from './sso-configuration.entity';

@Entity('sso_sessions')
@Index(['user_id', 'is_active'])
@Index(['session_token'])
export class SsoSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid' })
    sso_configuration_id: string;

    @ManyToOne(() => SsoConfiguration)
    @JoinColumn({ name: 'sso_configuration_id' })
    sso_configuration: SsoConfiguration;

    @Column({ unique: true })
    session_token: string;

    @Column({ type: 'jsonb', nullable: true })
    sso_user_info: any; // Store provider-specific user info

    @Column({ type: 'timestamp' })
    expires_at: Date;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    ip_address: string;

    @Column({ nullable: true })
    user_agent: string;

    @CreateDateColumn()
    created_at: Date;
}
