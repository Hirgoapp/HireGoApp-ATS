import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

/**
 * Client Entity
 * 
 * Table: clients
 * Matches PostgreSQL schema exactly
 * PK: id (INTEGER, auto-increment)
 * 
 * This is a NEW entity that job_requirements references
 */
@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    industry: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    payment_terms: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    gst_number: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    pan_number: string;

    @Column({ type: 'date', nullable: true })
    agreement_start: Date;

    @Column({ type: 'date', nullable: true })
    agreement_end: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    billing_email: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @UpdateDateColumn()
    updated_at: Date;
}
