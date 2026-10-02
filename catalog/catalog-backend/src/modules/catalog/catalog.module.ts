import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUTH_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { ProductEntity } from '../../database/product.entity';
import { AUTH_GRPC_URL } from './catalog-auth.service';
import { CatalogAuthService } from './catalog-auth.service';
import { CatalogController } from './catalog.controller';
import { ProductsStore } from './products.store';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    // catalog-backend is a client of auth-backend: it re-validates the caller's
    // token for owner-scoped RPCs rather than trusting the BFF's opinion.
    ClientsModule.register([
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: PACKAGE_NAME,
          protoPath: demoProtoPath(),
          url: process.env[AUTH_GRPC_URL] ?? 'localhost:5101',
          loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
        },
      },
    ]),
  ],
  controllers: [CatalogController],
  providers: [ProductsStore, CatalogAuthService],
})
export class CatalogModule {}
