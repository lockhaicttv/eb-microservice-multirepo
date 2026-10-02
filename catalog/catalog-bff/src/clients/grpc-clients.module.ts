import { Module, Global } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME, CATALOG_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { AUTH_GRPC_CLIENT, AUTH_GRPC_URL, CATALOG_GRPC_CLIENT, CATALOG_GRPC_URL } from './grpc-client.tokens';
import { CatalogGatewayService } from '../graphql/catalog-gateway.service';

/**
 * One injection token per upstream, each holding its OWN `ClientGrpcProxy`.
 *
 * Why not `ClientsModule.register([...])` plus a single injected `ClientGrpc`:
 * `ClientGrpcProxy.getService(name)` resolves the underlying gRPC client with
 * `getClient(name)`, which is `grpcClients.find(c => c.hasOwnProperty(name))`.
 * Every proxy here is built from the same `demo.proto`, so *every* proxy has a
 * property for *every* service — `hasOwnProperty('AuthService')` is true on the
 * catalog proxy too. The first registered proxy therefore always wins, and
 * `createClientByServiceName` then dials **that proxy's** `this.url`. Result:
 * auth calls silently went to catalog-backend and every owner-surface query
 * failed with `UNIMPLEMENTED: The server does not implement the method
 * ValidateToken`.
 *
 * Separate proxies give each token its own `url`, so the lookup can only ever
 * match the right upstream.
 */
const registerProxy = (token: string, serviceName: string, urlEnv: string, fallbackUrl: string) => ({
  provide: token,
  useFactory: () => {
    const proxy = new ClientGrpcProxy({
      package: PACKAGE_NAME,
      protoPath: demoProtoPath(),
      url: process.env[urlEnv] ?? fallbackUrl,
      loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
    });
    // Resolve the service eagerly so a bad URL fails at boot, not on first use.
    proxy.getService(serviceName);
    return proxy;
  },
});

@Global()
@Module({
  providers: [
    registerProxy(CATALOG_GRPC_CLIENT, CATALOG_SERVICE_NAME, CATALOG_GRPC_URL, 'localhost:5102'),
    registerProxy(AUTH_GRPC_CLIENT, AUTH_SERVICE_NAME, AUTH_GRPC_URL, 'localhost:5101'),
    CatalogGatewayService,
  ],
  exports: [CatalogGatewayService, CATALOG_GRPC_CLIENT, AUTH_GRPC_CLIENT],
})
export class GrpcClientsModule {}
