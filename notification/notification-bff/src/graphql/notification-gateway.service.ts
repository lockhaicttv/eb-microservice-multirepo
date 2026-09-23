import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATION_SERVICE_NAME, NotificationServiceClient } from '@demo/contracts';

@Injectable()
export class NotificationGatewayService implements OnModuleInit {
  private client!: NotificationServiceClient;

  constructor(@Inject(NOTIFICATION_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<NotificationServiceClient>(NOTIFICATION_SERVICE_NAME);
  }

  async listNotifications(userId: string) {
    const res = await firstValueFrom(this.client.listNotifications({ userId }));
    return res.notifications;
  }
}