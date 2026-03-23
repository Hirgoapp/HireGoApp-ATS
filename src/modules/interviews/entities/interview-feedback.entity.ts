import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Interview } from './interview.entity';
import { User } from '../../../auth/entities/user.entity';

export enum Recommendation {
    HIRE = 'hire',
    NO_HIRE = 'no_hire',
    NEUTRAL = 'neutral',
}

@Entity('interview_feedback')
@Index('unique_feedback_per_reviewer', ['company_id', 'interview_id', 'reviewer_id'], { unique: true })
export class InterviewFeedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('uuid')
    interview_id: string;

    @Column({ type: 'uuid' })
    reviewer_id: string;

    @Column({ type: 'numeric', precision: 3, scale: 1 })
    rating: number;

    @Column({ type: 'enum', enum: Recommendation })
    recommendation: Recommendation;

    @Column({ type: 'text', nullable: true })
    comments: string | null;

    @CreateDateColumn()
    submitted_at: Date;

    @ManyToOne(() => Interview, (interview) => interview.feedback, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'interview_id' })
    interview: Interview;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;
}
