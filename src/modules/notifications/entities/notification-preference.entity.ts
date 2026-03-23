import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../auth/entities/user.entity';

@Entity('notification_preferences')
@Index(['user_id', 'notification_type'], { unique: true })
export class NotificationPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 100 })
    notification_type: string;

    @Column({ type: 'boolean', default: true })
    in_app_enabled: boolean;

    @Column({ type: 'boolean', default: true })
    email_enabled: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
