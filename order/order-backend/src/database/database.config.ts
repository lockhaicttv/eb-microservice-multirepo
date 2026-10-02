import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { OrderEntity } from './order.entity';
import { InitialOrderSchema1735000000000 } from './migrations/1735000000000-InitialOrderSchema';

loadEnv();

export const DEFAULT_DATABASE_URL = 'postgres://demo:demo123@localhost:5432/order';

export function buildDataSourceOptions(databaseUrl?: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    entities: [OrderEntity],
    migrations: [InitialOrderSchema1735000000000],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    migrationsTableName: 'order_migrations',
    logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
