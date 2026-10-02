import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `users` table owned by auth-backend.
 * Written by hand rather than generated so the intent (and the unique index
 * name) is reviewable in the diff.
 */
export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "name" varchar(200) NOT NULL,
        "password_hash" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Uniqueness lives in the schema, so a duplicate register is rejected by
    // Postgres itself rather than by a racy application-level pre-check.
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "uq_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}