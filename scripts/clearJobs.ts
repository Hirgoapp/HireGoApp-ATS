import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Job } from '../src/modules/jobs/entities/job.entity';
import { Company } from '../src/companies/entities/company.entity';
import { User } from '../src/auth/entities/user.entity';
import { Pipeline } from '../src/modules/pipelines/entities/pipeline.entity';

async function main() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: [Job, Company, User, Pipeline],
        synchronize: false,
        ssl: false,
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(Job);
    const result = await repo.delete({});
    console.log(`Deleted jobs: ${result.affected ?? 0}`);
    await dataSource.destroy();
}

main().catch((err) => {
    console.error('Failed to clear jobs', err);
    process.exit(1);
});
