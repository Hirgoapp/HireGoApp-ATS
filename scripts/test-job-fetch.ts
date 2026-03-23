import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

async function testJobFetch() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
    });

    try {
        await ds.initialize();
        console.log('✓ Database connected\n');

        const jobId = '596b944c-f9a6-439a-b81e-88257d33662e';

        // Check what the backend query would do
        console.log('=== Simulating Backend Query ===');

        // Query 1: Find job WITHOUT company_id filter (what should work)
        const jobWithoutFilter = await ds.query(
            `SELECT id, company_id, title, status, deleted_at FROM jobs WHERE id = $1`,
            [jobId]
        );
        console.log('Job (no company filter):', jobWithoutFilter);

        // Query 2: Find job WITH company_id filter (what backend actually does)
        const companyId = '00000000-0000-0000-0000-000000000001';
        const jobWithFilter = await ds.query(
            `SELECT id, company_id, title, status, deleted_at 
             FROM jobs 
             WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
            [jobId, companyId]
        );
        console.log('\nJob (with company filter):', jobWithFilter);

        // Query 3: Check all users and their companies
        console.log('\n=== Users ===');
        const users = await ds.query(
            `SELECT id, email, company_id FROM users ORDER BY created_at LIMIT 5`
        );
        users.forEach((u: any) => {
            console.log(`- ${u.email}: company_id=${u.company_id}`);
        });

        // Query 4: Check if there are any soft-deleted jobs
        const deletedJobs = await ds.query(
            `SELECT id, title, deleted_at FROM jobs WHERE id = $1 AND deleted_at IS NOT NULL`,
            [jobId]
        );
        console.log('\n=== Deleted Jobs ===');
        console.log(deletedJobs.length > 0 ? deletedJobs : 'None');

        await ds.destroy();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testJobFetch();
