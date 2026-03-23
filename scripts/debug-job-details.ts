import 'dotenv/config';
import { DataSource } from 'typeorm';

async function main() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: [],
        synchronize: false,
        logging: false,
        ssl: false,
    });

    await ds.initialize();

    // Check job details
    const jobId = '596b944c-f9a6-439a-b81e-88257d33662e';
    const jobRow = await ds.query('select id, company_id, title, deleted_at from jobs where id = $1', [jobId]);
    console.log('📋 Job details:', jobRow);

    // Check all users and their companies
    const users = await ds.query('select id, email, company_id from users order by created_at limit 5');
    console.log('👥 Users:', users);

    // Check all companies
    const companies = await ds.query('select id, name from companies order by created_at limit 5');
    console.log('🏢 Companies:', companies);

    await ds.destroy();
}

main().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
