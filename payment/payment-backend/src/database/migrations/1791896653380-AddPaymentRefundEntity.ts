import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentRefundEntity1791896653380 implements MigrationInterface {
    name = 'AddPaymentRefundEntity1791896653380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Purely additive: create the refunds table. The generated migration also
        // wanted to drop `chk_payments_status` and `idx_payments_order_id` (the
        // entity does not redeclare them), but those are owned by the initial
        // schema and must not be touched.
        await queryRunner.query(`CREATE TABLE "refunds" ("id" character varying(64) NOT NULL, "order_id" character varying(64) NOT NULL, "user_id" uuid NOT NULL, "total_amount" numeric(12,2) NOT NULL, "status" character varying(20) NOT NULL, "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_6e3331148991078bb5cddc66fd" CHECK (status IN ('ISSUED','FAILED')), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refunds_order_id" ON "refunds" ("order_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_refunds_order_id"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
    }

}
