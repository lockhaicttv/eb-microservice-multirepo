import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPaymentSchema1735000000000 implements MigrationInterface {
  name = 'InitialPaymentSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" varchar(64) PRIMARY KEY,
        "order_id" varchar(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "total_amount" numeric(12,2) NOT NULL,
        "status" varchar(20) NOT NULL,
        "reason" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_payments_status" CHECK (status IN ('PENDING', 'PAID', 'DECLINED'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_payments_order_id" ON "payments" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_payments_order_id"`);
    await queryRunner.query(`DROP TABLE "payments"`);
  }
}
