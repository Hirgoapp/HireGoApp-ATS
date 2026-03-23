import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'ats_saas',
});

async function quickSeed() {
    try {
        await dataSource.initialize();
        console.log('✅ Database connected\n');

        // Get existing company
        const company = await dataSource.query(
            `SELECT id, name, email FROM companies WHERE slug = 'default-company'`
        );

        if (!company || company.length === 0) {
            throw new Error('No company found. Run bootstrap seed first.');
        }

        console.log('✅ Using company:', company[0]);

        // Hash password
        const passwordHash = await bcrypt.hash('Admin123!', 10);

        // Create admin user  
        const userData = await dataSource.query(
            `INSERT INTO users (company_id, first_name, last_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (company_id, email) DO UPDATE 
       SET first_name = $2, password_hash = $5
       RETURNING id, email, first_name, last_name`,
            [
                company[0].id,
                'System',
                'Administrator',
                'admin@example.com',
                passwordHash,
                JSON.stringify({ name: 'Admin', permissions: ['*'] }),
                true,
                true
            ]
        );

        console.log('✅ Admin user:', userData[0]);
        console.log('\n🎉 Seed complete!');
        console.log(`   Email:    ${userData[0].email}`);
        console.log(`   Password: Admin123!`);
        console.log(`   URL:      http://localhost:5173/login\n`);

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

quickSeed();
