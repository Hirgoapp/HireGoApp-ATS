import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

/**
 * Business-level activity entry for timeline/history views.
 * Scoped per tenant via company_id.
 */
@Entity('activities')
@Index('idx_activities_company_entity', ['company_id', 'entity_type', 'entity_id'])
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    company_id: string;

    @Column('varchar', { length: 100 })
    entity_type: string; // Client, Job, Candidate, Submission, etc.

    @Column('uuid')
    entity_id: string;

    @Column('varchar', { length: 100 })
    activity_type: string; // CREATED, UPDATED, STATUS_CHANGED, NOTE_ADDED, etc.

    @Column('text')
    message: string;

    @Column('jsonb', { nullable: true })
    metadata: any;

    @Column('uuid', { nullable: true })
    created_by: string | null;

    @CreateDateColumn()
    created_at: Date;
}

