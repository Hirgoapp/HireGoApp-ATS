import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';

/**
 * Client Entity (SIMPLIFIED - Phase 1)
 * Represents client organizations that send job requirements
 * (e.g., Infosys, TCS, Wipro, etc.)
 *
 * IMPORTANT: This is NOT a master data repository for Phase 1.
 * - Client name/info is for reference only
 * - Submission rules, rates, compliance are PER-REQUIREMENT (in job_instructions, etc.)
 * - Email content ALWAYS overrides any client metadata
 * - Future phases can expand with rate cards, contact persons, etc.
 */
@Entity('clients')
@Index(['company_id', 'deleted_at'])
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    /**
     * Client name (e.g., Infosys, TCS, Wipro)
     * Reference only — not authoritative for requirement rules
     */
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
