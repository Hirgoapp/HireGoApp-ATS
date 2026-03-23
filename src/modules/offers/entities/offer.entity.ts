import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum OfferStatus {
    DRAFT = 'draft',
    ISSUED = 'issued',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
    EXPIRED = 'expired',
}

@Entity('offers')
@Index('idx_offers_company_submission', ['company_id', 'submission_id'])
@Index('idx_offers_company_status', ['company_id', 'status'])
export class Offer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('uuid')
    submission_id: string;

    @Column('integer')
    current_version: number;

    @Column('integer')
    offer_version: number;

    @Column({
        type: 'enum',
        enum: OfferStatus,
        enumName: 'offers_status_enum',
        default: OfferStatus.DRAFT,
    })
    status: OfferStatus;

    @Column('numeric')
    ctc: string;

    @Column({ type: 'jsonb' })
    breakup: Record<string, any>;

    @Column({ type: 'varchar', length: 255 })
    designation: string;

    @Column({ type: 'date' })
    joining_date: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    department: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reporting_manager: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string | null;

    @Column({ type: 'text', nullable: true })
    terms_and_conditions: string | null;

    @Column({ type: 'text', nullable: true })
    rejection_reason: string | null;

    @Column({ type: 'text', nullable: true })
    internal_notes: string | null;

    @Column({ type: 'timestamp', nullable: true })
    sent_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    accepted_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date | null;

    @Column('uuid')
    created_by_id: string;

    @Column('uuid', { nullable: true })
    updated_by_id: string | null;

    @Column({ type: 'varchar', length: 10, default: 'USD' })
    currency: string;

    @Column({ type: 'numeric', nullable: true })
    base_salary: string | null;

    @Column({ type: 'numeric', nullable: true })
    bonus: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    equity: string | null;

    @Column({
        type: 'enum',
        enumName: 'employment_type_enum',
        enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary'],
        default: 'full_time',
    })
    employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';

    @Column({ type: 'date', nullable: true })
    start_date: Date | null;

    @Column({ type: 'date', nullable: true })
    expiry_date: Date | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date | null;
}

