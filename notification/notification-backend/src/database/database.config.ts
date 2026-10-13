import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { InitialNotificationSchema1735000000000 } from './migrations/1735000000000-InitialNotificationSchema';
import { AddRefundEntity1791896403005 } from './migrations/1791896403005-AddRefundEntity';

loadEnv();

export const DEFAULT_DATABASE_URL = 'postgres://demo:demo123@localhost:5432/notification';

export function buildDataSourceOptions(databaseUrl?: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    entities: [NotificationEntity],
    migrations: [InitialNotificationSchema1735000000000, AddRefundEntity1791896403005],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    migrationsTableName: 'notification_migrations',
    logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
