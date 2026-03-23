import { DataSource } from 'typeorm';
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

async function verifyDatabase() {
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established\n');

        // Get all tables
        const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

        console.log(`📊 Total tables created: ${tables.length}\n`);
        console.log('Tables:');
        tables.forEach((t: any, i: number) => {
            console.log(`${(i + 1).toString().padStart(2, ' ')}. ${t.table_name}`);
        });

        // Count migrations
        const migrations = await dataSource.query('SELECT COUNT(*) FROM migrations');
        console.log(`\n✅ Migrations executed: ${migrations[0].count}`);

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyDatabase();
