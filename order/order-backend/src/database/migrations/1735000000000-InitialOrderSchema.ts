import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialOrderSchema1735000000000 implements MigrationInterface {
  name = 'InitialOrderSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" varchar(64) PRIMARY KEY,
        "user_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL,
        "total_amount" numeric(12,2) NOT NULL,
        "line_items" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_orders_status" CHECK (status IN ('PENDING', 'PAID', 'DECLINED'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_orders_user_id" ON "orders" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_created_at" ON "orders" ("created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_orders_created_at"`);
    await queryRunner.query(`DROP INDEX "idx_orders_user_id"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
