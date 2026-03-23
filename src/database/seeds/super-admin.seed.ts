import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SuperAdminUser } from '../../super-admin/entities/super-admin-user.entity';

export interface SuperAdminSeedOptions {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

const DEFAULT_EMAIL = 'admin@ats.com';
const DEFAULT_PASSWORD = 'ChangeMe@123';
const DEFAULT_FIRST_NAME = 'Super';
const DEFAULT_LAST_NAME = 'Admin';
const DEFAULT_ROLE = 'super_admin';
const BCRYPT_ROUNDS = 10;

export async function seedSuperAdminUser(
    dataSource: DataSource,
    options: SuperAdminSeedOptions = {}
): Promise<SuperAdminUser> {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }

    const result = await dataSource.query(
        "SELECT to_regclass('public.super_admin_users') AS table_name;"
    );

    if (!result?.[0]?.table_name) {
        throw new Error('super_admin_users table missing. Run migrations first.');
    }

    const repository = dataSource.getRepository(SuperAdminUser);
    const email = options.email || DEFAULT_EMAIL;

    const existing = await repository.findOne({ where: { email } });
    if (existing) {
        console.log(`Super admin already exists: ${email}`);
        return existing;
    }

    const password = options.password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = repository.create({
        email,
        password_hash: passwordHash,
        first_name: options.firstName || DEFAULT_FIRST_NAME,
        last_name: options.lastName || DEFAULT_LAST_NAME,
        role: options.role || DEFAULT_ROLE,
        is_active: true,
        permissions: {},
        preferences: {},
    });

    const saved = await repository.save(user);
    console.log(`Created super admin: ${email}`);
    return saved;
}
