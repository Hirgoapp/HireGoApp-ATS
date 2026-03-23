import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../../auth/entities/user.entity';

export enum EvaluationStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('evaluations')
export class Evaluation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    application_id: string;

    @Column({ type: 'uuid' })
    evaluator_id: string;

    @Column({ type: 'integer' })
    rating: number; // 1-5 scale

    @Column({
        type: 'varchar',
        length: 50,
        default: EvaluationStatus.PENDING,
    })
    status: EvaluationStatus;

    @Column({ type: 'text', nullable: true })
    feedback: string;

    @Column({ type: 'text', nullable: true })
    strengths: string;

    @Column({ type: 'text', nullable: true })
    weaknesses: string;

    @Column({ type: 'text', nullable: true })
    recommendation: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Application)
    @JoinColumn({ name: 'application_id' })
    application: Application;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'evaluator_id' })
    evaluator: User;
}
