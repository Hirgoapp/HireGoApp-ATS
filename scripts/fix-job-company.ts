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

    // Get the first user (likely the logged-in super admin)
    const userRow = await ds.query('select id, company_id from users limit 1');
    if (!userRow.length) {
        throw new Error('No users found in database');
    }
    const userCompanyId = userRow[0].company_id;
    console.log('📌 User company_id:', userCompanyId);

    // Update the recently created job to use user's company
    const jobId = '596b944c-f9a6-439a-b81e-88257d33662e';
    const updateSql = `
    UPDATE jobs
    SET company_id = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, company_id, title, created_at;
  `;

    const result = await ds.query(updateSql, [userCompanyId, jobId]);
    if (result.length) {
        console.log('✅ Updated job company_id:', result[0]);
    } else {
        console.log('⚠️ Job not found');
    }

    await ds.destroy();
}

main().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
