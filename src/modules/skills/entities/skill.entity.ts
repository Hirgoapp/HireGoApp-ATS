import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { User } from '../../../auth/entities/user.entity';
import { SkillCategory } from './skill-category.entity';

@Entity('skills')
@Index(['company_id'])
@Index(['company_id', 'name'], { unique: true })
@Index(['company_id', 'category_id'])
@Index(['company_id', 'is_active'])
@Index(['company_id', 'deleted_at'])
export class Skill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    company_id: string;

    @Column({ type: 'uuid', nullable: true })
    category_id: string | null;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Optional scale like beginner/intermediate/advanced' })
    proficiency_scale: string | null;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => SkillCategory, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    category: SkillCategory;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' })
    updater: User;
}
