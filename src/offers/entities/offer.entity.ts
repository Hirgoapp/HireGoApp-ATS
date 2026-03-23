import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Submission } from '../../modules/submissions/entities/submission.entity';
import { User } from '../../auth/entities/user.entity';

export enum OfferStatusEnum {
    DRAFT = 'draft',
    ISSUED = 'issued',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
}

export enum EmploymentTypeEnum {
    FULL_TIME = 'full_time',
    CONTRACT = 'contract',
    INTERN = 'intern',
    PART_TIME = 'part_time',
}

@Entity('offers')
export class Offer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column('uuid')
    submission_id: string;

    @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @Column('enum', {
        enum: OfferStatusEnum,
        default: OfferStatusEnum.DRAFT,
    })
    status: OfferStatusEnum;

    @Column('integer', { default: 1 })
    offer_version: number;

    @Column('varchar', { length: 3, default: 'USD' })
    currency: string;

    @Column('decimal', { precision: 15, scale: 2, nullable: true })
    base_salary: number;

    @Column('decimal', { precision: 15, scale: 2, nullable: true })
    bonus: number;

    @Column('varchar', { length: 100, nullable: true })
    equity: string;

    @Column('enum', {
        enum: EmploymentTypeEnum,
        default: EmploymentTypeEnum.FULL_TIME,
    })
    employment_type: EmploymentTypeEnum;

    @Column('date', { nullable: true })
    start_date: Date;

    @Column('date', { nullable: true })
    expiry_date: Date;

    @Column('text', { nullable: true })
    notes: string;

    @Column('integer')
    created_by_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Column('integer', { nullable: true })
    updated_by_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by_id' })
    updated_by: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;
}
