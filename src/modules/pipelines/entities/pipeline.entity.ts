import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';
import { PipelineStage } from './pipeline-stage.entity';

@Entity('pipelines')
export class Pipeline {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    is_default: boolean;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updater: User;

    @OneToMany(() => PipelineStage, (stage) => stage.pipeline, { cascade: true })
    stages: PipelineStage[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
