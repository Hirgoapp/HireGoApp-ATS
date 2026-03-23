import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMissingCandidateSubTables1769200200000 implements MigrationInterface {
    name = 'CreateMissingCandidateSubTables1769200200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create candidate_skills table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_skills',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'skill_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'proficiency',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'years_of_experience',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'certified',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'hands_on_level',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'last_used',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'relevant_years',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'relevant_months',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_skills',
            new TableIndex({
                name: 'IDX_CANDIDATE_SKILLS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_skills',
            new TableIndex({
                name: 'IDX_CANDIDATE_SKILLS_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_skills',
            new TableIndex({
                name: 'IDX_CANDIDATE_SKILLS_SKILL',
                columnNames: ['skill_id'],
            }),
        );

        // 2. Create candidate_education table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_education',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'institution',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'qualification_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'specialization',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'year_of_passing',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'grade',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'document_path',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_education',
            new TableIndex({
                name: 'IDX_CANDIDATE_EDUCATION_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_education',
            new TableIndex({
                name: 'IDX_CANDIDATE_EDUCATION_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        // 3. Create candidate_experience table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_experience',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'company_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'job_title',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'start_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'end_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'is_current',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'remarks',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_experience',
            new TableIndex({
                name: 'IDX_CANDIDATE_EXPERIENCE_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_experience',
            new TableIndex({
                name: 'IDX_CANDIDATE_EXPERIENCE_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        // 4. Create candidate_documents table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_documents',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'file_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'file_path',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'document_type_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'section_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'section_ref_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'verified',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'expiry_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'remarks',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'uploaded_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_documents',
            new TableIndex({
                name: 'IDX_CANDIDATE_DOCUMENTS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_documents',
            new TableIndex({
                name: 'IDX_CANDIDATE_DOCUMENTS_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        // 5. Create candidate_addresses table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_addresses',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'address_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'city',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'state',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'country',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'pincode',
                        type: 'varchar',
                        length: '15',
                        isNullable: true,
                    },
                    {
                        name: 'document_path',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_addresses',
            new TableIndex({
                name: 'IDX_CANDIDATE_ADDRESSES_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_addresses',
            new TableIndex({
                name: 'IDX_CANDIDATE_ADDRESSES_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        // 6. Create candidate_history table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_history',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'handled_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'handled_on',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'action',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'skill_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_history',
            new TableIndex({
                name: 'IDX_CANDIDATE_HISTORY_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_history',
            new TableIndex({
                name: 'IDX_CANDIDATE_HISTORY_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_history',
            new TableIndex({
                name: 'IDX_CANDIDATE_HISTORY_HANDLED_BY',
                columnNames: ['handled_by'],
            }),
        );

        // 7. Create candidate_attachments table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_attachments',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'doc_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'filename',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'file_path',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'file_size',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'mime_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'uploaded_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'candidate_attachments',
            new TableIndex({
                name: 'IDX_CANDIDATE_ATTACHMENTS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidate_attachments',
            new TableIndex({
                name: 'IDX_CANDIDATE_ATTACHMENTS_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('candidate_attachments', true);
        await queryRunner.dropTable('candidate_history', true);
        await queryRunner.dropTable('candidate_addresses', true);
        await queryRunner.dropTable('candidate_documents', true);
        await queryRunner.dropTable('candidate_experience', true);
        await queryRunner.dropTable('candidate_education', true);
        await queryRunner.dropTable('candidate_skills', true);
    }
}
