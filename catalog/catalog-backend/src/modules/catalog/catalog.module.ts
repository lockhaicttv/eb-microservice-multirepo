import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { ProductsStore } from './products.store';

@Module({
  controllers: [CatalogController],
  providers: [ProductsStore],
})
export class CatalogModule {}