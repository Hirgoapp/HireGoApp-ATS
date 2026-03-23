import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDocumentsTable1704067209000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'documents',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'candidate_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_by_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'file_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'file_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'file_size',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'mime_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 's3_key',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'document_type',
                        type: 'varchar',
                        length: '50',
                        default: "'resume'",
                        isNullable: false,
                    },
                    {
                        name: 'extracted_text',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'extracted_metadata',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'processing_status',
                        type: 'varchar',
                        length: '50',
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                        onUpdate: 'NOW()',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'documents',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'documents',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'documents',
            new TableForeignKey({
                columnNames: ['uploaded_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_company_candidate',
                columnNames: ['company_id', 'candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'documents',
            new TableIndex({
                name: 'IDX_documents_company_type',
                columnNames: ['company_id', 'document_type'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('documents', true);
    }
}
