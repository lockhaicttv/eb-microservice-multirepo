import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { AuthGatewayService } from '../graphql/auth-gateway.service';

export const AUTH_GRPC_URL = 'AUTH_GRPC_URL';

const defineClient = (name: string): ClientProviderOptions => ({
  name,
  transport: Transport.GRPC,
  options: {
    package: PACKAGE_NAME,
    protoPath: demoProtoPath(),
    url: process.env[AUTH_GRPC_URL] ?? 'localhost:5101',
    loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
  },
});

@Global()
@Module({
  imports: [ClientsModule.register([defineClient(AUTH_SERVICE_NAME)])],
  providers: [AuthGatewayService],
  exports: [AuthGatewayService],
})
export class GrpcClientsModule {}