import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { bootstrapAdminUser } from './src/database/seeds/0-bootstrap-admin';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'ats_saas',
    entities: ['src/**/entities/*.entity.ts'],
    synchronize: false,
});

async function runSeeds() {
    try {
        await dataSource.initialize();
        console.log('✅ Database connected\n');

        // Run bootstrap seed
        await bootstrapAdminUser(dataSource, {
            password: 'Admin123!',
            firstName: 'System',
            lastName: 'Administrator',
        });

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

runSeeds();
