import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database.config';

/**
 * Owns the Postgres connection for this service. `@Global` because the catalog
 * module's repository is injected from here; no other module may open a second
 * pool.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        // ConfigService is the runtime env source of truth; the plain
        // process.env read inside buildDataSourceOptions covers the CLI case.
        buildDataSourceOptions(config.get<string>('DATABASE_URL')),
    }),
  ],
})
export class DatabaseModule {}
