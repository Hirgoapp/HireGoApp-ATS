import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'ats_saas',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
    logging: true,
});

AppDataSource.initialize()
    .then(async () => {
        console.log('✅ Data Source initialized');
        console.log('📊 Running migrations...');
        const migrations = await AppDataSource.runMigrations();
        console.log(`✅ Executed ${migrations.length} migrations`);
        await AppDataSource.destroy();
    })
    .catch((error) => console.error('❌ Error:', error));
