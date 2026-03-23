import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'ats_saas',
    synchronize: false,
});

async function seedSuperAdmin() {
    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        const passwordHash = await bcrypt.hash('SuperAdmin123!', 10);

        await dataSource.query(
            `INSERT INTO super_admin_users 
            (email, password_hash, first_name, last_name, role, is_active, permissions, preferences, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (email) DO NOTHING`,
            ['super@admin.com', passwordHash, 'Super', 'Admin', 'super_admin', true, JSON.stringify({}), JSON.stringify({})]
        );

        console.log('✅ Super admin created:');
        console.log('   Email: super@admin.com');
        console.log('   Password: SuperAdmin123!');

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
