import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../../auth/entities/user.entity';
import { Company } from '../../../companies/entities/company.entity';

export enum BetaStatus {
    INVITED = 'invited',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
}

export enum BetaTier {
    ALPHA = 'alpha', // Internal testing, very limited
    CLOSED_BETA = 'closed_beta', // Selected external users
    OPEN_BETA = 'open_beta', // Anyone can join
    EARLY_ACCESS = 'early_access', // Pre-launch access
}

@Entity('beta_users')
@Index(['company_id', 'status'])
@Index(['user_id', 'status'])
export class BetaUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'enum', enum: BetaStatus, default: BetaStatus.INVITED })
    status: BetaStatus;

    @Column({ type: 'enum', enum: BetaTier, default: BetaTier.CLOSED_BETA })
    tier: BetaTier;

    @Column({ type: 'text', nullable: true })
    invitation_note: string;

    @Column({ type: 'timestamp', nullable: true })
    invited_at: Date;

    @Column({ type: 'uuid', nullable: true })
    invited_by: string;

    @Column({ type: 'timestamp', nullable: true })
    accepted_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @Column({ type: 'jsonb', nullable: true })
    features_enabled: string[]; // List of feature flags enabled for this beta user

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        company_size?: string;
        industry?: string;
        use_case?: string;
        nda_signed?: boolean;
        feedback_frequency?: string; // daily, weekly, monthly
    };

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
