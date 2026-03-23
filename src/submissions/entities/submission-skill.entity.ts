import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { RequirementSubmission } from './requirement-submission.entity';
import { SkillMaster } from '../../common/entities/skill-master.entity';

@Entity('submission_skills')
export class SubmissionSkill {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', nullable: false })
    submission_id: number;

    @ManyToOne(() => RequirementSubmission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission_id' })
    submission: RequirementSubmission;

    @Column({ type: 'integer', nullable: false })
    skill_id: number;

    @ManyToOne(() => SkillMaster, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'skill_id' })
    skill: SkillMaster;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    experience_years: number;

    @Column('varchar', { length: 50, nullable: true })
    proficiency: string;

    @CreateDateColumn()
    created_at: Date;
}
