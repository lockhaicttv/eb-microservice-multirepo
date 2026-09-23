import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { CATALOG_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { CatalogGatewayService } from '../graphql/catalog-gateway.service';

export const CATALOG_GRPC_URL = 'CATALOG_GRPC_URL';

const defineClient = (name: string): ClientProviderOptions => ({
  name,
  transport: Transport.GRPC,
  options: {
    package: PACKAGE_NAME,
    protoPath: demoProtoPath(),
    url: process.env[CATALOG_GRPC_URL] ?? 'localhost:5102',
    loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
  },
});

@Global()
@Module({
  imports: [ClientsModule.register([defineClient(CATALOG_SERVICE_NAME)])],
  providers: [CatalogGatewayService],
  exports: [CatalogGatewayService],
})
export class GrpcClientsModule {}