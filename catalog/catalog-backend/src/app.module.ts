import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CatalogModule],
})
export class AppModule {}