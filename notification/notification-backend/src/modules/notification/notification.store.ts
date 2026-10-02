import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@demo/contracts';
import { NotificationEntity, NotificationType } from '../../database/notification.entity';

function toContractNotification(entity: NotificationEntity): Notification {
  return {
    id: entity.id,
    userId: entity.userId,
    type: entity.type as Notification['type'],
    message: entity.message,
    createdAt: entity.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationStore {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.notifications.save(
      this.notifications.create({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        message: notification.message,
      }),
    );
    return toContractNotification(saved);
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(toContractNotification);
  }
}
