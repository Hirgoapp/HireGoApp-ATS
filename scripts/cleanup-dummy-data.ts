import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

async function cleanupDummyData() {
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

        // Delete the dummy job
        const jobId = '596b944c-f9a6-439a-b81e-88257d33662e';

        const result = await ds.query(
            `DELETE FROM jobs WHERE id = $1`,
            [jobId]
        );

        console.log(`✓ Deleted dummy job: ${jobId}`);
        console.log(`✓ Rows affected: ${result.length}\n`);

        // Verify deletion
        const check = await ds.query(
            `SELECT COUNT(*) FROM jobs WHERE id = $1`,
            [jobId]
        );

        console.log('✓ Verification - Job count after deletion:', check[0].count);
        console.log('\n✅ Cleanup complete!');

        await ds.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupDummyData();
