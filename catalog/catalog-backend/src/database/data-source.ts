import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

/**
 * CLI entrypoint used by `npm run migration:*`. Kept separate from the Nest
 * DataSource so migration commands never boot the gRPC transport.
 *
 * Export exactly one DataSource instance from this file — the TypeORM CLI
 * loader rejects a module that exports more than one.
 */
export const AppDataSource = new DataSource(buildDataSourceOptions());
