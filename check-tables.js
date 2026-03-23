const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'employee_tracker',
    user: 'postgres',
    password: 'password',
});

async function checkTable(tableName) {
    try {
        const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);

        if (result.rows.length === 0) {
            console.log(`⚠️  Table not found: ${tableName}`);
            return;
        }

        console.log(`\n📋 TABLE: ${tableName}`);
        console.log('-'.repeat(80));
        result.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defval = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defval}`);
        });
    } catch (error) {
        console.error(`Error checking table ${tableName}:`, error.message);
    }
}

async function main() {
    try {
        await client.connect();

        await checkTable('users');
        await checkTable('roles');
        await checkTable('requirement_submissions');
        await checkTable('clients');
        await checkTable('locations');
        await checkTable('skill_masters');
        await checkTable('qualifications');

        await client.end();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
