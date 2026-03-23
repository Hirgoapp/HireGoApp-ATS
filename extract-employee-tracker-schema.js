const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    database: 'employee_tracker',
    user: 'postgres',
    password: 'password'
});

(async function extractSchema() {
    try {
        await client.connect();
        console.log('✅ Connected to employee_tracker database\n');

        // Get all tables
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name;
    `;
        const tables = await client.query(tablesQuery);

        console.log(`Found ${tables.rows.length} tables:\n`);
        tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
        console.log('\n' + '='.repeat(80) + '\n');

        let schemaDoc = `# Employee Tracker Database Schema\n\nExtracted: ${new Date().toISOString()}\n\n`;
        schemaDoc += `## Tables (${tables.rows.length})\n\n`;

        // For each table, get columns, constraints, and relationships
        for (const table of tables.rows) {
            const tableName = table.table_name;
            console.log(`📋 Analyzing table: ${tableName}`);

            schemaDoc += `### ${tableName}\n\n`;

            // Get columns
            const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `;
            const columns = await client.query(columnsQuery, [tableName]);

            schemaDoc += `**Columns (${columns.rows.length}):**\n\n`;
            schemaDoc += '| Column | Type | Nullable | Default |\n';
            schemaDoc += '|--------|------|----------|----------|\n';

            columns.rows.forEach(col => {
                const type = col.character_maximum_length
                    ? `${col.data_type}(${col.character_maximum_length})`
                    : col.data_type;
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default || '-';
                schemaDoc += `| ${col.column_name} | ${type} | ${nullable} | ${defaultVal} |\n`;
            });

            schemaDoc += '\n';

            // Get primary key
            const pkQuery = `
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary;
      `;
            const pk = await client.query(pkQuery, [tableName]);

            if (pk.rows.length > 0) {
                schemaDoc += `**Primary Key:** ${pk.rows.map(r => r.attname).join(', ')}\n\n`;
            }

            // Get foreign keys
            const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1;
      `;
            const fks = await client.query(fkQuery, [tableName]);

            if (fks.rows.length > 0) {
                schemaDoc += `**Foreign Keys:**\n\n`;
                fks.rows.forEach(fk => {
                    schemaDoc += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
                });
                schemaDoc += '\n';
            }

            // Get indexes
            const idxQuery = `
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1
        AND schemaname = 'public';
      `;
            const indexes = await client.query(idxQuery, [tableName]);

            if (indexes.rows.length > 0) {
                schemaDoc += `**Indexes:**\n\n`;
                indexes.rows.forEach(idx => {
                    schemaDoc += `- \`${idx.indexname}\`\n`;
                });
                schemaDoc += '\n';
            }

            schemaDoc += '---\n\n';
        }

        // Write to file
        fs.writeFileSync('EMPLOYEE_TRACKER_SCHEMA.md', schemaDoc);
        console.log('\n✅ Schema extracted to EMPLOYEE_TRACKER_SCHEMA.md');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
})();
