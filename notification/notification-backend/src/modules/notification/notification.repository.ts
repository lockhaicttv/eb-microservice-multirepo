import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@demo/contracts';
import { NotificationEntity, fromEntity, toEntity } from '../../database/notification.entity';

/**
 * Notification persistence adapter. Wraps the TypeORM repository with
 * notification-specific operations and keeps entity types out of the
 * application layer: callers work with the `Notification` contract only, and the
 * entity owns the row <-> contract mapping (`fromEntity` / `toEntity`).
 */
@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.notifications.save(toEntity(notification));
    return fromEntity(saved);
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(fromEntity);
  }
}
