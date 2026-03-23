import 'dotenv/config';
import { DataSource } from 'typeorm';

async function main() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: [],
        synchronize: false,
        logging: false,
        ssl: false,
    });
    await ds.initialize();
    const cols = await ds.query(
        "select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='jobs' order by ordinal_position"
    );
    console.log(cols);
    await ds.destroy();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
