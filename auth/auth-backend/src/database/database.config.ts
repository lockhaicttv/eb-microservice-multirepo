import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { UserEntity } from './user.entity';
import { InitialSchema1735000000000 } from './migrations/1735000000000-InitialSchema';
import { AddUserRole1735000001000 } from './migrations/1735000001000-AddUserRole';

// The Nest runtime gets .env from ConfigModule, but the `typeorm` CLI boots
// plain Node, so load it here. Missing file is fine — env vars may be set
// externally, and the defaults below still apply.
loadEnv();

/**
 * Single source of truth for the auth database connection. Consumed by both the
 * runtime Nest module and the `typeorm` CLI (`data-source.ts`), so migrations
 * always target exactly the same database the service uses.
 *
 * Config comes from DATABASE_URL (default matches docker-compose.yml).
 * Set DB_SYNCHRONIZE=true only for throwaway local experiments — the committed
 * path is `npm run migration:run`.
 */
export const DEFAULT_DATABASE_URL = 'postgres://demo:demo123@localhost:5432/auth';

export function buildDataSourceOptions(databaseUrl?: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    entities: [UserEntity],
    // Migrations are registered explicitly rather than globbed, so adding a file
    // does not silently change what a deploy applies.
    migrations: [InitialSchema1735000000000, AddUserRole1735000001000],
    // Schema is owned by migrations. `synchronize` is opt-in and off by default
    // so a running database can never be silently rewritten from entity metadata.
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    migrationsTableName: 'auth_migrations',
    logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}