import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the event start time to `products`.
 *
 * `starts_at` is nullable: a listing whose start is unknown is valid, and refund
 * eligibility treats "unknown" as "not started". The seeded demo events are
 * backfilled relative to `now()` — e-1/e-2 have already started (a refund is
 * refused), e-3..e-5 are still upcoming — so the demo database always exercises
 * both branches no matter how old it gets.
 */
export class AddProductStartsAt1791897000000 implements MigrationInterface {
  name = 'AddProductStartsAt1791897000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "starts_at" timestamptz NULL`);

    await queryRunner.query(
      `UPDATE "products" SET "starts_at" = now() - interval '30 days' WHERE "id" = 'e-1'`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "starts_at" = now() - interval '10 days' WHERE "id" = 'e-2'`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "starts_at" = now() + interval '30 days' WHERE "id" = 'e-3'`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "starts_at" = now() + interval '90 days' WHERE "id" = 'e-4'`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "starts_at" = now() + interval '180 days' WHERE "id" = 'e-5'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "starts_at"`);
  }
}
