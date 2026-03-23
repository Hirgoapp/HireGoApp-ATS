import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('qualifications')
export class Qualification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 255, nullable: false })
    name: string;

    @Column('boolean', { default: true })
    active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
