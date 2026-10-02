import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `products` table owned by catalog-backend.
 *
 * Written by hand rather than generated so the intent — and the constraint and
 * index names — are reviewable in the diff.
 */
export class InitialCatalogSchema1735000000000 implements MigrationInterface {
  name = 'InitialCatalogSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        -- varchar rather than uuid: the seeded demo listings keep their original
        -- 'e-1'..'e-5' ids, which the frontend and any existing order lines
        -- already reference by string. Writers that omit an id get a uuid.
        "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "price" numeric(10,2) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "owner_user_id" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Stock is this service's own invariant, so it is enforced by the database
    // rather than by application-level checks that a future write path could skip.
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "chk_products_stock_non_negative" CHECK ("stock" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "chk_products_price_non_negative" CHECK ("price" >= 0)`,
    );

    // The owner dashboard filters by owner; every browse is a table scan of a
    // handful of rows, so this is the only index that earns its upkeep.
    await queryRunner.query(`CREATE INDEX "idx_products_owner_user_id" ON "products" ("owner_user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_products_owner_user_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "chk_products_price_non_negative"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "chk_products_stock_non_negative"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
