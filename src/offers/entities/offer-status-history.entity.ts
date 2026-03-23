import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Offer } from './offer.entity';
import { User } from '../../auth/entities/user.entity';
import { OfferStatusEnum } from './offer.entity';

@Entity('offer_status_history')
export class OfferStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column('uuid')
    offer_id: string;

    @ManyToOne(() => Offer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'offer_id' })
    offer: Offer;

    @Column('enum', { enum: OfferStatusEnum })
    old_status: OfferStatusEnum;

    @Column('enum', { enum: OfferStatusEnum })
    new_status: OfferStatusEnum;

    @Column('integer')
    changed_by_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'changed_by_id' })
    changed_by: User;

    @CreateDateColumn()
    changed_at: Date;

    @Column('text', { nullable: true })
    reason: string;

    @Column('jsonb', { default: '{}' })
    metadata: Record<string, any>;
}
