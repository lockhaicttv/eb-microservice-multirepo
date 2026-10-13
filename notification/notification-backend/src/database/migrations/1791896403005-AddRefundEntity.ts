import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefundEntity1791896403005 implements MigrationInterface {
    name = 'AddRefundEntity1791896403005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_id_created_at"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "chk_notifications_type"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "CHK_d9ee5c7a362e6375f88b33e732" CHECK (type IN ('TICKETS_CONFIRMED','TICKETS_DECLINED','REFUND_ISSUED','REFUND_REJECTED'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "CHK_d9ee5c7a362e6375f88b33e732"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "chk_notifications_type" CHECK (((type)::text = ANY ((ARRAY['TICKETS_CONFIRMED'::character varying, 'TICKETS_DECLINED'::character varying])::text[])))`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at") `);
    }

}
