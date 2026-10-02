import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { InitialPaymentSchema1735000000000 } from './migrations/1735000000000-InitialPaymentSchema';

loadEnv();

export const DEFAULT_DATABASE_URL = 'postgres://demo:demo123@localhost:5432/payment';

export function buildDataSourceOptions(databaseUrl?: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    entities: [PaymentEntity],
    migrations: [InitialPaymentSchema1735000000000],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    migrationsTableName: 'payment_migrations',
    logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
