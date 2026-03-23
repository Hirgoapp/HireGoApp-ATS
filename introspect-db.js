const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'employee_tracker',
    user: 'postgres',
    password: 'password',
});

async function introspect() {
    try {
        await client.connect();
        console.log('✅ Connected to employee_tracker database\n');

        const atsRelevantTables = [
            'candidates', 'jobs', 'submissions', 'interviews', 'offers',
            'users', 'roles', 'permissions', 'companies',
            'candidate_education', 'candidate_experience', 'candidate_skills',
            'submission_skills', 'job_requirements'
        ];

        // Focus on ATS-relevant tables
        for (const tableName of atsRelevantTables) {
            try {
                const columns = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

                if (columns.rows.length === 0) {
                    console.log(`⚠️  TABLE NOT FOUND: ${tableName}`);
                    continue;
                }

                console.log(`\n📋 TABLE: ${tableName}`);
                console.log('-'.repeat(80));
                columns.rows.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                    const defval = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                    console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defval}`);
                });
            } catch (e) {
                console.log(`⚠️  Error reading table ${tableName}: ${e.message}`);
            }
        }

        console.log('\n\n✅ Schema introspection complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

introspect();
