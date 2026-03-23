import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersTable1767901001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        submission_id UUID NOT NULL,
        status offer_status_enum NOT NULL DEFAULT 'draft',
        offer_version INTEGER NOT NULL DEFAULT 1,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        base_salary DECIMAL(15, 2),
        bonus DECIMAL(15, 2),
        equity VARCHAR(100),
        employment_type employment_type_enum NOT NULL DEFAULT 'full_time',
        start_date DATE,
        expiry_date DATE,
        notes TEXT,
        created_by_id UUID,
        updated_by_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      ALTER TABLE offers
        ADD COLUMN IF NOT EXISTS offer_version INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS bonus DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS equity VARCHAR(100),
        ADD COLUMN IF NOT EXISTS employment_type employment_type_enum NOT NULL DEFAULT 'full_time',
        ADD COLUMN IF NOT EXISTS start_date DATE,
        ADD COLUMN IF NOT EXISTS expiry_date DATE,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_by_id UUID,
        ADD COLUMN IF NOT EXISTS updated_by_id UUID,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'offers' AND column_name = 'created_by_id' AND udt_name <> 'uuid'
        ) THEN
          ALTER TABLE offers ALTER COLUMN created_by_id DROP NOT NULL;
          ALTER TABLE offers ALTER COLUMN created_by_id TYPE UUID USING NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'offers' AND column_name = 'updated_by_id' AND udt_name <> 'uuid'
        ) THEN
          ALTER TABLE offers ALTER COLUMN updated_by_id DROP NOT NULL;
          ALTER TABLE offers ALTER COLUMN updated_by_id TYPE UUID USING NULL;
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uk_offers_submission_version
      ON offers (submission_id, offer_version)
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_company_status
      ON offers (company_id, status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_company_submission
      ON offers (company_id, submission_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_created_by
      ON offers (created_by_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_deleted
      ON offers (company_id, deleted_at);
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_company'
        ) THEN
          ALTER TABLE offers
          ADD CONSTRAINT fk_offers_company
          FOREIGN KEY (company_id) REFERENCES companies (id)
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_submission'
        ) THEN
          ALTER TABLE offers
          ADD CONSTRAINT fk_offers_submission
          FOREIGN KEY (submission_id) REFERENCES submissions (id)
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_created_by'
        ) THEN
          ALTER TABLE offers
          ADD CONSTRAINT fk_offers_created_by
          FOREIGN KEY (created_by_id) REFERENCES users (id)
          ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_updated_by'
        ) THEN
          ALTER TABLE offers
          ADD CONSTRAINT fk_offers_updated_by
          FOREIGN KEY (updated_by_id) REFERENCES users (id)
          ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_updated_by') THEN
          ALTER TABLE offers DROP CONSTRAINT fk_offers_updated_by;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_created_by') THEN
          ALTER TABLE offers DROP CONSTRAINT fk_offers_created_by;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_submission') THEN
          ALTER TABLE offers DROP CONSTRAINT fk_offers_submission;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_offers_company') THEN
          ALTER TABLE offers DROP CONSTRAINT fk_offers_company;
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_deleted;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_created_by;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_company_submission;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_company_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS uk_offers_submission_version;`);

    await queryRunner.query(`DROP TABLE IF EXISTS offers;`);
  }
}
