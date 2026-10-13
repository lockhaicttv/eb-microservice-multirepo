import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefundEntity1791896403005 implements MigrationInterface {
    name = 'AddRefundEntity1791896403005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Widen the type CHECK in place, keeping the original name. The index
        // `idx_notifications_user_id_created_at` is intentionally left untouched:
        // it is created by the initial schema and only `migration:generate`
        // wanted to drop it (the entity does not redeclare it).
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "chk_notifications_type"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "chk_notifications_type" CHECK (type IN ('TICKETS_CONFIRMED','TICKETS_DECLINED','REFUND_ISSUED','REFUND_REJECTED'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "chk_notifications_type"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "chk_notifications_type" CHECK (type IN ('TICKETS_CONFIRMED','TICKETS_DECLINED'))`);
    }

}
