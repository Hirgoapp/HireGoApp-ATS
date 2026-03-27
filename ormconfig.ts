import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Railway (and other PaaS providers) supply DATABASE_URL as a full connection string.
// When present it takes precedence over individual DB_* variables.
const databaseUrl = process.env.DATABASE_URL;
// Set DB_SSL_REJECT_UNAUTHORIZED=false only if your provider uses self-signed certificates.
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const AppDataSource = new DataSource(
    databaseUrl
        ? {
              type: 'postgres',
              url: databaseUrl,
              entities: ['src/**/*.entity.ts'],
              migrations: ['src/database/migrations/*.ts'],
              logging: false,
              synchronize: false,
              ssl: { rejectUnauthorized },
          }
        : {
              type: 'postgres',
              host: process.env.DB_HOST || '127.0.0.1',
              port: parseInt(process.env.DB_PORT || '5432', 10),
              username: process.env.DB_USERNAME || 'postgres',
              password: process.env.DB_PASSWORD || '',
              database: process.env.DB_DATABASE || 'ats_saas',
              entities: ['src/**/*.entity.ts'],
              migrations: ['src/database/migrations/*.ts'],
              logging: false,
              synchronize: false,
              ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized } : false,
          },
);

export default AppDataSource;
