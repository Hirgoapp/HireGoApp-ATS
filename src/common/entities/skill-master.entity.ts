import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('skill_masters')
export class SkillMaster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 255, nullable: false })
    name: string;

    @CreateDateColumn()
    created_at: Date;
}
