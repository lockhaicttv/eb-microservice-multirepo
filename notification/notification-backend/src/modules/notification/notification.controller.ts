import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE_NAME, ListNotificationsRequest, ListNotificationsResponse } from '@demo/contracts';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @GrpcMethod(NOTIFICATION_SERVICE_NAME, 'ListNotifications')
  async listNotifications(req: ListNotificationsRequest): Promise<ListNotificationsResponse> {
    return { notifications: await this.notifications.listByUser(req.userId) };
  }
}