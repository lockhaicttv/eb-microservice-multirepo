import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the event start time to `products`.
 *
 * `starts_at` is nullable: a listing whose start is unknown is valid, and refund
 * eligibility treats "unknown" as "not started". This is a pure schema change —
 * the seeded values are set by `seed.ts`, not here, so the migration stays free
 * of data that would drift as the demo database ages.
 */
export class AddProductStartsAt1791897000000 implements MigrationInterface {
  name = 'AddProductStartsAt1791897000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "starts_at" timestamptz NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "starts_at"`);
  }
}
