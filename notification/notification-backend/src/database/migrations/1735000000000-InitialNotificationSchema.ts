import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialNotificationSchema1735000000000 implements MigrationInterface {
  name = 'InitialNotificationSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" varchar(64) PRIMARY KEY,
        "user_id" uuid NOT NULL,
        "type" varchar(30) NOT NULL,
        "message" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_notifications_type" CHECK (type IN ('TICKETS_CONFIRMED', 'TICKETS_DECLINED'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_notifications_user_id_created_at"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
