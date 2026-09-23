import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE_NAME, AUTH_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { NotificationGatewayService } from '../graphql/notification-gateway.service';
import { AuthGatewayService } from '../graphql/auth-gateway.service';

export const NOTIFICATION_GRPC_URL = 'NOTIFICATION_GRPC_URL';
export const AUTH_GRPC_URL = 'AUTH_GRPC_URL';

const defineClient = (name: string, url: string): ClientProviderOptions => ({
  name,
  transport: Transport.GRPC,
  options: {
    package: PACKAGE_NAME,
    protoPath: demoProtoPath(),
    url,
    loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
  },
});

@Global()
@Module({
  imports: [
    ClientsModule.register([
      defineClient(NOTIFICATION_SERVICE_NAME, process.env[NOTIFICATION_GRPC_URL] ?? 'localhost:5105'),
      defineClient(AUTH_SERVICE_NAME, process.env[AUTH_GRPC_URL] ?? 'localhost:5101'),
    ]),
  ],
  providers: [NotificationGatewayService, AuthGatewayService],
  exports: [NotificationGatewayService, AuthGatewayService],
})
export class GrpcClientsModule {}