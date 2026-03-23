import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, Index } from 'typeorm';
import { Application } from './application.entity';
import { v4 as uuidv4 } from 'uuid';

export enum RejectionReasonType {
    SKILLS_MISMATCH = 'skills_mismatch',
    EXPERIENCE_INSUFFICIENT = 'experience_insufficient',
    CULTURE_FIT = 'culture_fit',
    OVERQUALIFIED = 'overqualified',
    OTHER = 'other',
    NO_SHOW = 'no_show',
    CANDIDATE_DECLINED = 'candidate_declined',
}

@Entity('rejection_reasons')
@Index(['application_id'])
@Index(['company_id'])
@Index(['created_at'])
export class RejectionReason {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column('uuid')
    application_id: string;

    @Column('uuid')
    company_id: string;

    @Column({
        type: 'enum',
        enum: RejectionReasonType,
        default: RejectionReasonType.OTHER,
    })
    reason_type: RejectionReasonType;

    @Column('text')
    reason_details: string;

    @Column('uuid', { nullable: true })
    rejected_by: string;

    @ManyToOne(() => Application, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'application_id' })
    application: Application;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
