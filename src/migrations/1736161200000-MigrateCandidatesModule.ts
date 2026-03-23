import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateCandidatesModule1736161200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create candidates table
        await queryRunner.createTable(
            new Table({
                name: 'candidates',
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
                        name: 'candidate_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: false,
                    },
                    {
                        name: 'alternate_phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'gender',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'dob',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'marital_status',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'current_company',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'total_experience',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'relevant_experience',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'current_ctc',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'expected_ctc',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'currency_code',
                        type: 'varchar',
                        length: '3',
                        isNullable: true,
                        default: "'INR'",
                    },
                    {
                        name: 'notice_period',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'willing_to_relocate',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'buyout',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'reason_for_job_change',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'skill_set',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'current_location_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'location_preference',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'candidate_status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        default: "'Active'",
                    },
                    {
                        name: 'source_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'last_contacted_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'last_submission_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'extra_fields',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
                    },
                    {
                        name: 'aadhar_number',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'uan_number',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'linkedin_url',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'manager_screening_status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        default: "'Pending'",
                    },
                    {
                        name: 'client_name',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'highest_qualification',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'submission_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'job_location',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'client',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'recruiter_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'date_of_entry',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'manager_screening',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'resume_parser_used',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'extraction_confidence',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'extraction_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'resume_source_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'is_suspicious',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'cv_portal_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'import_batch_id',
                        type: 'varchar',
                        length: '50',
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

        // Add indexes for candidates
        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_EMAIL',
                columnNames: ['email'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_PHONE',
                columnNames: ['phone'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_STATUS',
                columnNames: ['candidate_status'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_SOURCE',
                columnNames: ['source_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_RECRUITER',
                columnNames: ['recruiter_id'],
            }),
        );

        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_DATE_ENTRY',
                columnNames: ['date_of_entry'],
            }),
        );

        // Composite index for company + status
        await queryRunner.createIndex(
            'candidates',
            new TableIndex({
                name: 'IDX_CANDIDATES_COMPANY_STATUS',
                columnNames: ['company_id', 'candidate_status'],
            }),
        );

        // 2. Create candidate_skills table
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

        // 3. Create candidate_education table
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

        // 4. Create candidate_experience table
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

        // 5. Create candidate_documents table
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

        // 6. Create candidate_addresses table
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

        // 7. Create candidate_history table
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

        // 8. Create candidate_attachments table
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

        // Add foreign keys
        await queryRunner.createForeignKey(
            'candidates',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_skills',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_skills',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_education',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_education',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_experience',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_experience',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_documents',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_documents',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_addresses',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_addresses',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_history',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_history',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_attachments',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_attachments',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop in reverse order
        await queryRunner.dropTable('candidate_attachments');
        await queryRunner.dropTable('candidate_history');
        await queryRunner.dropTable('candidate_addresses');
        await queryRunner.dropTable('candidate_documents');
        await queryRunner.dropTable('candidate_experience');
        await queryRunner.dropTable('candidate_education');
        await queryRunner.dropTable('candidate_skills');
        await queryRunner.dropTable('candidates');
    }
}
