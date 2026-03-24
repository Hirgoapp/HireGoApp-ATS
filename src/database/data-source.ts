import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Railway (and other PaaS providers) supply DATABASE_URL as a full connection string.
// When present it takes precedence over individual DB_* variables.
const databaseUrl = process.env.DATABASE_URL;
// Set DB_SSL_REJECT_UNAUTHORIZED=false only if your provider uses self-signed certificates.
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

export const AppDataSource = new DataSource(
    databaseUrl
        ? {
              type: 'postgres',
              url: databaseUrl,
              entities: ['dist/**/*.entity.js'],
              migrations: ['dist/database/migrations/*.js'],
              synchronize: false,
              logging: true,
              ssl: { rejectUnauthorized },
          }
        : {
              type: 'postgres',
              host: process.env.DB_HOST || '127.0.0.1',
              port: parseInt(process.env.DB_PORT || '5432'),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || 'password',
              database: process.env.DB_DATABASE || 'ats_saas',
              entities: ['dist/**/*.entity.js'],
              migrations: ['dist/database/migrations/*.js'],
              synchronize: false,
              logging: true,
              ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized } : false,
          },
);

AppDataSource.initialize()
    .then(async () => {
        console.log('✅ Data Source initialized');
        console.log('📊 Running migrations...');
        const migrations = await AppDataSource.runMigrations();
        console.log(`✅ ${migrations.length} migration(s) completed`);
        await AppDataSource.destroy();
        process.exit(0);
    })
    .catch((error) => {
        console.log('❌ Error:', error.message);
        process.exit(1);
    });
