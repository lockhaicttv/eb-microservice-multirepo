import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefundedOrderStatus1791894410951 implements MigrationInterface {
    name = 'AddRefundedOrderStatus1791894410951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "chk_orders_status"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "CHK_97ca777e54179e92e27e286a99" CHECK (status IN ('PENDING','PAID','DECLINED','REFUNDED'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "CHK_97ca777e54179e92e27e286a99"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_status" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'DECLINED'::character varying])::text[])))`);
    }

}
