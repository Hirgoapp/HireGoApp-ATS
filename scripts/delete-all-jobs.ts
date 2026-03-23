import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

async function deleteAllJobs() {
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
        console.log('✓ Connected to database\n');

        // Get all jobs first
        const allJobs = await ds.query(`SELECT id, title FROM jobs`);
        console.log(`Found ${allJobs.length} jobs to delete:\n`);
        allJobs.forEach((j: any) => {
            console.log(`  - ${j.title} (${j.id})`);
        });

        // Delete all jobs
        const result = await ds.query(`DELETE FROM jobs`);
        console.log(`\n✓ Deleted all jobs from database`);

        // Verify
        const check = await ds.query(`SELECT COUNT(*) FROM jobs`);
        console.log(`✓ Jobs remaining: ${check[0].count}\n`);

        console.log('✅ Database is now clean - ready for testing!');

        await ds.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteAllJobs();
