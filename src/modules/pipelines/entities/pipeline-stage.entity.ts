import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Pipeline } from './pipeline.entity';

export enum StageType {
    APPLIED = 'applied',
    SCREENING = 'screening',
    PHONE_SCREEN = 'phone_screen',
    INTERVIEW = 'interview',
    TECHNICAL = 'technical',
    FINAL_INTERVIEW = 'final_interview',
    OFFER = 'offer',
    HIRED = 'hired',
    REJECTED = 'rejected',
}

@Entity('pipeline_stages')
export class PipelineStage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    pipeline_id: string;

    @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pipeline_id' })
    pipeline: Pipeline;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int' })
    stage_order: number;

    @Column({ type: 'varchar', length: 50 })
    stage_type: StageType;

    @Column({ type: 'varchar', length: 20, nullable: true })
    color: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
