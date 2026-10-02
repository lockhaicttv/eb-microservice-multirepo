import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME, CATALOG_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { CatalogGatewayService } from '../graphql/catalog-gateway.service';

export const CATALOG_GRPC_URL = 'CATALOG_GRPC_URL';
export const AUTH_GRPC_URL = 'AUTH_GRPC_URL';

const defineClient = (name: string, urlEnv: string, fallbackUrl: string): ClientProviderOptions => ({
  name,
  transport: Transport.GRPC,
  options: {
    package: PACKAGE_NAME,
    protoPath: demoProtoPath(),
    url: process.env[urlEnv] ?? fallbackUrl,
    loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
  },
});

/**
 * Both clients come from one `ClientGrpc` handle: `getService(name)` is looked up
 * by the registration name, so registering auth under its own constant is what
 * makes the second `getService` call in the gateway resolve.
 */
@Global()
@Module({
  imports: [
    ClientsModule.register([
      defineClient(CATALOG_SERVICE_NAME, CATALOG_GRPC_URL, 'localhost:5102'),
      defineClient(AUTH_SERVICE_NAME, AUTH_GRPC_URL, 'localhost:5101'),
    ]),
  ],
  providers: [CatalogGatewayService],
  exports: [CatalogGatewayService],
})
export class GrpcClientsModule {}
