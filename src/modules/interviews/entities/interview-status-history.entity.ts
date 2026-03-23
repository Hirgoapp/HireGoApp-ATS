import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Interview, InterviewStatus } from './interview.entity';
import { User } from '../../../auth/entities/user.entity';

@Entity('interview_status_history')
@Index('interview_status_history_lookup', ['interview_id', 'company_id'])
export class InterviewStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('uuid')
    interview_id: string;

    @Column({ type: 'enum', enum: InterviewStatus, enumName: 'interview_status' })
    status: InterviewStatus;

    @Column({ type: 'text', nullable: true })
    reason: string | null;

    @Column('integer')
    changed_by_user_id: number;

    @CreateDateColumn()
    changed_at: Date;

    @ManyToOne(() => Interview, (interview) => interview.status_history, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'interview_id' })
    interview: Interview;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'changed_by_user_id' })
    changed_by_user: User | null;
}
