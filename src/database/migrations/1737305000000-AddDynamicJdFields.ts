import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDynamicJdFields1737305000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'jobs';

        const columns: TableColumn[] = [
            new TableColumn({
                name: 'jd_content',
                type: 'text',
                isNullable: true,
                comment: 'Dynamic job description content (markdown/html/plain text)',
            }),
            new TableColumn({
                name: 'jd_format',
                type: 'varchar',
                length: '20',
                isNullable: true,
                default: "'plain'",
                comment: 'Format of JD content: plain, markdown, html, structured',
            }),
            new TableColumn({
                name: 'jd_file_url',
                type: 'varchar',
                length: '500',
                isNullable: true,
                comment: 'URL/path to uploaded JD file (PDF, DOCX, etc.)',
            }),
            new TableColumn({
                name: 'jd_file_metadata',
                type: 'jsonb',
                isNullable: true,
                default: "'{}'",
                comment: 'Metadata about uploaded JD file',
            }),
            new TableColumn({
                name: 'jd_sections',
                type: 'jsonb',
                isNullable: true,
                default: "'[]'",
                comment: 'Parsed sections from JD (responsibilities, qualifications, etc.)',
            }),
            new TableColumn({
                name: 'use_dynamic_jd',
                type: 'boolean',
                default: false,
                comment: 'If true, use jd_content; if false, use legacy description/requirements fields',
            }),
        ];

        const table = await queryRunner.getTable(tableName);

        for (const column of columns) {
            if (!table?.findColumnByName(column.name)) {
                await queryRunner.addColumn(tableName, column);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'jobs';
        const columns = ['use_dynamic_jd', 'jd_sections', 'jd_file_metadata', 'jd_file_url', 'jd_format', 'jd_content'];

        const table = await queryRunner.getTable(tableName);

        for (const columnName of columns) {
            if (table?.findColumnByName(columnName)) {
                await queryRunner.dropColumn(tableName, columnName);
            }
        }
    }
}
