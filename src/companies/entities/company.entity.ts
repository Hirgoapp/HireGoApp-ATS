import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'text', nullable: true })
    logo_url: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    brand_color: string;

    @Column({ type: 'varchar', length: 50, default: 'basic' })
    license_tier: string;

    @Column({ type: 'jsonb', default: {} })
    feature_flags: Record<string, any>;

    @Column({ type: 'jsonb', default: {} })
    settings: Record<string, any>;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date;
}
