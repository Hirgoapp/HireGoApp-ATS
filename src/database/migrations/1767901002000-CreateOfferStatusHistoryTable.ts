import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOfferStatusHistoryTable1767901002000
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS offer_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        offer_id UUID NOT NULL,
        old_status offer_status_enum NOT NULL,
        new_status offer_status_enum NOT NULL,
        changed_by_id UUID,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reason TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE offer_status_history
        ADD COLUMN IF NOT EXISTS changed_by_id UUID,
        ADD COLUMN IF NOT EXISTS company_id UUID,
        ADD COLUMN IF NOT EXISTS offer_id UUID,
        ADD COLUMN IF NOT EXISTS old_status offer_status_enum,
        ADD COLUMN IF NOT EXISTS new_status offer_status_enum,
        ADD COLUMN IF NOT EXISTS changed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS reason TEXT,
        ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'offer_status_history'
            AND column_name = 'changed_by_id'
            AND udt_name <> 'uuid'
        ) THEN
          ALTER TABLE offer_status_history ALTER COLUMN changed_by_id DROP NOT NULL;
          ALTER TABLE offer_status_history ALTER COLUMN changed_by_id TYPE UUID USING NULL;
        END IF;
      END;
      $$;
    `);

    // Create index for offer + company
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offer_history_offer
      ON offer_status_history (offer_id, company_id);
    `);

    // Create index for company + date
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offer_history_company_date
      ON offer_status_history (company_id, changed_at DESC);
    `);

    // Create index for changed_by
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_offer_history_changed_by
      ON offer_status_history (changed_by_id);
    `);

    // Add foreign key to companies
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offer_history_company'
        ) THEN
          ALTER TABLE offer_status_history
          ADD CONSTRAINT fk_offer_history_company
          FOREIGN KEY (company_id) REFERENCES companies (id)
          ON DELETE CASCADE;
        END IF;
      END;
      $$;
    `);

    // Add foreign key to offers
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offer_history_offer'
        ) THEN
          ALTER TABLE offer_status_history
          ADD CONSTRAINT fk_offer_history_offer
          FOREIGN KEY (offer_id) REFERENCES offers (id)
          ON DELETE CASCADE;
        END IF;
      END;
      $$;
    `);

    // Add foreign key to users
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_offer_history_user'
        ) THEN
          ALTER TABLE offer_status_history
          ADD CONSTRAINT fk_offer_history_user
          FOREIGN KEY (changed_by_id) REFERENCES users (id)
          ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE offer_status_history
      DROP CONSTRAINT fk_offer_history_user;
    `);

    await queryRunner.query(`
      ALTER TABLE offer_status_history
      DROP CONSTRAINT fk_offer_history_offer;
    `);

    await queryRunner.query(`
      ALTER TABLE offer_status_history
      DROP CONSTRAINT fk_offer_history_company;
    `);

    await queryRunner.query(`DROP INDEX idx_offer_history_changed_by;`);
    await queryRunner.query(`DROP INDEX idx_offer_history_company_date;`);
    await queryRunner.query(`DROP INDEX idx_offer_history_offer;`);

    await queryRunner.query(`DROP TABLE offer_status_history;`);
  }
}
