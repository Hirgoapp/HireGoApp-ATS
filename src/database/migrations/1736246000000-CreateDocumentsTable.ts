import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateDocumentsTable1736246000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('documents');
        if (hasTable) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: 'documents',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'entity_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'entity_id', type: 'uuid', isNullable: false },
                    { name: 'file_name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'original_name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'file_path', type: 'varchar', length: '500', isNullable: false },
                    { name: 'file_size', type: 'bigint', isNullable: false },
                    { name: 'mime_type', type: 'varchar', length: '100', isNullable: false },
                    { name: 'document_type', type: 'varchar', length: '50', isNullable: false },
                    { name: 'storage_type', type: 'varchar', length: '20', default: "'local'" },
                    { name: 'extracted_text', type: 'text', isNullable: true },
                    { name: 'metadata', type: 'jsonb', isNullable: true },
                    { name: 'is_public', type: 'boolean', default: false },
                    { name: 'uploaded_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'documents',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'documents',
            new TableForeignKey({
                columnNames: ['uploaded_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_entity',
                columnNames: ['entity_type', 'entity_id'],
            }),
        );

        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_document_type',
                columnNames: ['document_type'],
            }),
        );

        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_deleted_at',
                columnNames: ['deleted_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('documents');
    }
}
