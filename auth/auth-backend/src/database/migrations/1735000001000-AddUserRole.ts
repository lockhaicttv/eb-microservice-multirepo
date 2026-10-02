import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `role` column.
 *
 * Three-step shape (add nullable -> backfill -> NOT NULL + CHECK) rather than a
 * single ADD COLUMN with a default: adding a NOT NULL column with a volatile
 * default, or a CHECK, takes an ACCESS EXCLUSIVE lock and rewrites the table.
 * The staged version keeps the write window tiny and lets the backfill finish
 * before the constraint lands.
 */
export class AddUserRole1735000001000 implements MigrationInterface {
  name = 'AddUserRole1735000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" varchar(20)`);

    // Every pre-existing account is a CUSTOMER: least privilege, and it matches
    // what those users actually had (browse + buy) before roles existed.
    await queryRunner.query(`UPDATE "users" SET "role" = 'CUSTOMER' WHERE "role" IS NULL`);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'`);

    // Database-enforced role set. An invalid role cannot be persisted even if
    // application validation is bypassed.
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "chk_users_role" CHECK ("role" IN ('ADMIN', 'EVENT_OWNER', 'CUSTOMER'))`,
    );

    // The admin page lists everyone and filters by role.
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "chk_users_role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
  }
}