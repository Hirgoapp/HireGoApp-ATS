import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

/**
 * Location Entity
 * 
 * Table: locations
 * Matches PostgreSQL schema exactly
 * PK: id (INTEGER, auto-increment)
 * 
 * Minimal entity: id, name
 */
@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;
}
