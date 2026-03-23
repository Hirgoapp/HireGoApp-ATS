import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailDrivenJobsTables1737369600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create clients table (SIMPLIFIED - Phase 1)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP,
                CONSTRAINT fk_clients_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        const hasEmailDomains = await queryRunner.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'email_domains'
        `);
        if (!hasEmailDomains || hasEmailDomains.length === 0) {
            await queryRunner.query(`
                ALTER TABLE clients ADD COLUMN email_domains JSONB DEFAULT '[]'
            `);
        }

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id, deleted_at)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_email_domains ON clients USING gin(email_domains)
        `);

        // 2. Create job_email_sources table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS job_email_sources (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                job_id UUID,
                client_id UUID,
                
                email_subject TEXT,
                sender_email VARCHAR(255),
                sender_name VARCHAR(255),
                received_date TIMESTAMP,
                email_thread_id VARCHAR(500),
                
                raw_email_content TEXT NOT NULL,
                raw_email_html TEXT,
                email_format VARCHAR(20) DEFAULT 'text',
                
                client_req_id VARCHAR(100),
                parsed_data JSONB DEFAULT '{}',
                parsing_status VARCHAR(50) DEFAULT 'pending',
                parsing_confidence DECIMAL(3,2),
                parsing_errors JSONB,
                
                attachments_metadata JSONB DEFAULT '[]',
                
                version INTEGER DEFAULT 1,
                is_latest BOOLEAN DEFAULT true,
                superseded_by UUID,
                
                imported_by_id UUID,
                processed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_email_sources_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_email_sources_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
                CONSTRAINT fk_email_sources_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
                CONSTRAINT fk_email_sources_imported_by FOREIGN KEY (imported_by_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_email_sources_company_job ON job_email_sources(company_id, job_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_email_sources_client_req ON job_email_sources(client_req_id, is_latest)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_email_sources_client ON job_email_sources(client_id, received_date DESC)
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sources_latest_req 
            ON job_email_sources(client_req_id, company_id) 
            WHERE is_latest = true
        `);

        // 3. Create job_instructions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS job_instructions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id UUID NOT NULL,
                company_id UUID NOT NULL,
                
                instruction_type VARCHAR(50) NOT NULL,
                title VARCHAR(255),
                content TEXT NOT NULL,
                content_format VARCHAR(20) DEFAULT 'text',
                
                display_order INTEGER DEFAULT 0,
                is_mandatory BOOLEAN DEFAULT true,
                highlight_level VARCHAR(20) DEFAULT 'normal',
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_instructions_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                CONSTRAINT fk_instructions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_job_instructions_job ON job_instructions(job_id, instruction_type)
        `);

        // 4. Create job_candidate_trackers table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS job_candidate_trackers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id UUID NOT NULL,
                company_id UUID NOT NULL,
                
                tracker_name VARCHAR(255) DEFAULT 'Candidate Tracker',
                required_fields JSONB NOT NULL,
                field_order TEXT[],
                validation_rules JSONB,
                template_content TEXT,
                
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_trackers_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                CONSTRAINT fk_trackers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_candidate_trackers_job ON job_candidate_trackers(job_id)
        `);

        // 5. Add new fields to jobs table
        await queryRunner.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS requirement_status VARCHAR(50) DEFAULT 'open',
            ADD COLUMN IF NOT EXISTS client_id UUID,
            ADD COLUMN IF NOT EXISTS client_req_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS client_project_manager VARCHAR(255),
            ADD COLUMN IF NOT EXISTS delivery_spoc VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pu_unit VARCHAR(100),
            ADD COLUMN IF NOT EXISTS vendor_rate_value DECIMAL(12,2),
            ADD COLUMN IF NOT EXISTS vendor_rate_currency VARCHAR(10) DEFAULT 'INR',
            ADD COLUMN IF NOT EXISTS vendor_rate_unit VARCHAR(20),
            ADD COLUMN IF NOT EXISTS vendor_rate_text TEXT,
            ADD COLUMN IF NOT EXISTS interview_mode VARCHAR(100),
            ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50),
            ADD COLUMN IF NOT EXISTS background_check_timing VARCHAR(50),
            ADD COLUMN IF NOT EXISTS domain_industry VARCHAR(255),
            ADD COLUMN IF NOT EXISTS relevant_experience VARCHAR(100),
            ADD COLUMN IF NOT EXISTS desired_skills TEXT[],
            ADD COLUMN IF NOT EXISTS work_locations TEXT[],
            ADD COLUMN IF NOT EXISTS submission_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS email_source_id UUID,
            ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS original_job_id UUID
        `);

        // Add foreign keys (only if not exists)
        const hasClientFk = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_jobs_client' AND table_name = 'jobs'
        `);
        if (!hasClientFk || hasClientFk.length === 0) {
            await queryRunner.query(`
                ALTER TABLE jobs 
                ADD CONSTRAINT fk_jobs_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
            `);
        }

        const hasEmailSourceFk = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_jobs_email_source' AND table_name = 'jobs'
        `);
        if (!hasEmailSourceFk || hasEmailSourceFk.length === 0) {
            await queryRunner.query(`
                ALTER TABLE jobs 
                ADD CONSTRAINT fk_jobs_email_source FOREIGN KEY (email_source_id) REFERENCES job_email_sources(id) ON DELETE SET NULL
            `);
        }

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_client_req ON jobs(client_req_id, company_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id, deleted_at)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_email_source ON jobs(email_source_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_jobs_email_source`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_jobs_client`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_jobs_client_req`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_candidate_trackers_job`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_job_instructions_job`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_email_sources_latest_req`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_email_sources_client`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_email_sources_client_req`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_email_sources_company_job`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_email_domains`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_company`);

        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS fk_jobs_email_source`);
        await queryRunner.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS fk_jobs_client`);

        // Drop columns from jobs
        await queryRunner.query(`
            ALTER TABLE jobs 
            DROP COLUMN IF NOT EXISTS original_job_id,
            DROP COLUMN IF NOT EXISTS is_latest_version,
            DROP COLUMN IF NOT EXISTS version,
            DROP COLUMN IF NOT EXISTS email_source_id,
            DROP COLUMN IF NOT EXISTS submission_email,
            DROP COLUMN IF NOT EXISTS work_locations,
            DROP COLUMN IF NOT EXISTS desired_skills,
            DROP COLUMN IF NOT EXISTS relevant_experience,
            DROP COLUMN IF NOT EXISTS domain_industry,
            DROP COLUMN IF NOT EXISTS background_check_timing,
            DROP COLUMN IF NOT EXISTS work_mode,
            DROP COLUMN IF NOT EXISTS interview_mode,
            DROP COLUMN IF NOT EXISTS vendor_rate_text,
            DROP COLUMN IF NOT EXISTS vendor_rate_unit,
            DROP COLUMN IF NOT EXISTS vendor_rate_currency,
            DROP COLUMN IF NOT EXISTS vendor_rate_value,
            DROP COLUMN IF NOT EXISTS pu_unit,
            DROP COLUMN IF NOT EXISTS delivery_spoc,
            DROP COLUMN IF NOT EXISTS client_project_manager,
            DROP COLUMN IF NOT EXISTS client_req_id,
            DROP COLUMN IF NOT EXISTS requirement_status,
            DROP COLUMN IF NOT EXISTS client_id
        `);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS job_candidate_trackers`);
        await queryRunner.query(`DROP TABLE IF EXISTS job_instructions`);
        await queryRunner.query(`DROP TABLE IF EXISTS job_email_sources`);
        await queryRunner.query(`DROP TABLE IF EXISTS clients`);
    }
}
