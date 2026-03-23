import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Interview } from './interview.entity';
import { User } from '../../../auth/entities/user.entity';

export enum InterviewerRole {
    INTERVIEWER = 'interviewer',
    PANELIST = 'panelist',
    OBSERVER = 'observer',
}

@Entity('interview_interviewers')
@Index('unique_interviewer_assignment', ['company_id', 'interview_id', 'interviewer_id'], { unique: true })
export class InterviewInterviewer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('uuid')
    interview_id: string;

    @Column({ name: 'interviewer_id', type: 'uuid' })
    interviewer_id: string;

    @Column({ type: 'enum', enum: InterviewerRole })
    role: InterviewerRole;

    @ManyToOne(() => Interview, (interview) => interview.interviewers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'interview_id' })
    interview: Interview;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'interviewer_id' })
    user: User;
}
