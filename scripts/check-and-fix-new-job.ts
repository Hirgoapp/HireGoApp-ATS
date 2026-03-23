import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

async function checkNewJob() {
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

        // Get the most recently created job
        const job = await ds.query(
            `SELECT id, title, company_id, created_by_id, status, created_at 
             FROM jobs 
             ORDER BY created_at DESC 
             LIMIT 1`
        );

        if (job.length === 0) {
            console.log('No jobs found');
            process.exit(1);
        }

        const latestJob = job[0];
        console.log('Latest Job Created:');
        console.log(`  ID: ${latestJob.id}`);
        console.log(`  Title: ${latestJob.title}`);
        console.log(`  Status: ${latestJob.status}`);
        console.log(`  Company ID: ${latestJob.company_id}`);
        console.log(`  Created By ID: ${latestJob.created_by_id}`);
        console.log(`  Created At: ${latestJob.created_at}\n`);

        // Check the logged-in user
        console.log('Logged-in User (itsupport@o2finfosolutions.com):');
        const user = await ds.query(
            `SELECT id, email, company_id FROM users WHERE email = $1`,
            ['itsupport@o2finfosolutions.com']
        );

        if (user.length > 0) {
            console.log(`  ID: ${user[0].id}`);
            console.log(`  Email: ${user[0].email}`);
            console.log(`  Company ID: ${user[0].company_id}\n`);

            // Check if they match
            if (latestJob.company_id === user[0].company_id) {
                console.log('✅ Company IDs MATCH - Job should be viewable!');
            } else {
                console.log('❌ Company IDs DO NOT MATCH');
                console.log(`   Job company: ${latestJob.company_id}`);
                console.log(`   User company: ${user[0].company_id}`);
                console.log('\n⚠️  Fixing job to match user company...');

                await ds.query(
                    `UPDATE jobs SET company_id = $1 WHERE id = $2`,
                    [user[0].company_id, latestJob.id]
                );

                console.log('✅ Job updated!');
            }
        }

        await ds.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkNewJob();
