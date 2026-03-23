import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

async function fixJobCompany() {
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

        // Get O2F user info
        const o2fUser = await ds.query(
            `SELECT id, email, company_id FROM users WHERE email = $1`,
            ['itsupport@o2finfosolutions.com']
        );

        if (o2fUser.length === 0) {
            console.error('O2F user not found!');
            process.exit(1);
        }

        const o2fCompanyId = o2fUser[0].company_id;
        const o2fUserId = o2fUser[0].id;

        console.log('O2F User:', o2fUser[0]);
        console.log('\nUpdating job to O2F company...');

        // Update job to belong to O2F company and created by O2F user
        await ds.query(
            `UPDATE jobs 
             SET company_id = $1, created_by_id = $2, updated_at = NOW()
             WHERE id = $3`,
            [o2fCompanyId, o2fUserId, jobId]
        );

        console.log('✓ Job updated successfully');

        // Verify
        const updatedJob = await ds.query(
            `SELECT id, title, company_id, created_by_id FROM jobs WHERE id = $1`,
            [jobId]
        );
        console.log('\nUpdated job:', updatedJob[0]);

        await ds.destroy();
        console.log('\n✓ Done! You should now be able to view the job.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixJobCompany();
