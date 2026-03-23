import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Company } from '../../companies/entities/company.entity';

/**
 * user_roles
 *
 * Many-to-many link between users and roles, scoped by company (tenant).
 * A user can have multiple roles per company.
 */
@Entity('user_roles')
@Index('IDX_user_roles_user_company', ['user_id', 'company_id'])
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    user_id: string;

    @Column('uuid')
    role_id: string;

    @Column('uuid')
    company_id: string;

    @CreateDateColumn({ name: 'assigned_at' })
    assigned_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id' })
    company: Company;
}

