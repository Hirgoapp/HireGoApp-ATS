import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix RBAC join tables to reference `users.id` (integer).
 *
 * Earlier RBAC migrations created `user_id` as UUID, but `users.id` is integer in this codebase.
 * This causes runtime errors like "invalid input syntax for type uuid" during permission checks.
 */
export class FixRbacUserIdTypes1768001000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // This project’s DB uses `users.id` as UUID (confirmed in production/dev DBs).
        // This migration was introduced to fix environments where `user_id` was created
        // as integer. In UUID-based DBs it should be a no-op but still “mark executed”.
        const usersIdType = await queryRunner.query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'id'
        `);
        const type = String(usersIdType?.[0]?.data_type || '').toLowerCase();
        if (type === 'uuid') {
            return;
        }

        // user_roles.user_id
        await queryRunner.query(`
            ALTER TABLE "user_roles"
            DROP CONSTRAINT IF EXISTS "fk_user_roles_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles"
            ALTER COLUMN "user_id" TYPE integer USING ("user_id"::text::integer)
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // user_permissions.user_id
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            DROP CONSTRAINT IF EXISTS "FK_user_permissions_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            DROP CONSTRAINT IF EXISTS "fk_user_permissions_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ALTER COLUMN "user_id" TYPE integer USING ("user_id"::text::integer)
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "fk_user_permissions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        // user_permissions.created_by_id (optional)
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            DROP CONSTRAINT IF EXISTS "FK_user_permissions_created_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            DROP CONSTRAINT IF EXISTS "fk_user_permissions_created_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ALTER COLUMN "created_by_id" TYPE integer USING (
                CASE
                    WHEN "created_by_id" IS NULL THEN NULL
                    ELSE "created_by_id"::text::integer
                END
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "fk_user_permissions_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op: this migration is intended as a one-way schema fix.
        return;
    }
}

