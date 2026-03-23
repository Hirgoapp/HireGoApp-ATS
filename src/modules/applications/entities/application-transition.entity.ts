import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';
import { User } from '../../../auth/entities/user.entity';

export enum TransitionReason {
    MANUAL_MOVE = 'manual_move',
    AUTO_ADVANCE = 'auto_advance',
    REJECTION = 'rejection',
    HIRE = 'hire',
    WITHDRAWAL = 'withdrawal',
    STATUS_CHANGE = 'status_change',
    BULK_OPERATION = 'bulk_operation',
}

@Entity('application_transitions')
export class ApplicationTransition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    application_id: string;

    @Column({ type: 'uuid' })
    from_stage_id: string;

    @Column({ type: 'uuid' })
    to_stage_id: string;

    @Column({ type: 'uuid', nullable: true })
    moved_by: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: TransitionReason.MANUAL_MOVE,
    })
    reason: TransitionReason;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    transitioned_at: Date;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    // Relations
    @ManyToOne(() => Application)
    @JoinColumn({ name: 'application_id' })
    application: Application;

    @ManyToOne(() => PipelineStage)
    @JoinColumn({ name: 'from_stage_id' })
    from_stage: PipelineStage;

    @ManyToOne(() => PipelineStage)
    @JoinColumn({ name: 'to_stage_id' })
    to_stage: PipelineStage;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'moved_by' })
    moved_by_user: User;
}
