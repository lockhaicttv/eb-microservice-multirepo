import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { Notification } from '../../database/models/notification.model';

/**
 * Notification persistence adapter. Wraps the TypeORM repository with
 * notification-specific operations and keeps entity types out of the
 * application layer: callers work with the `Notification` domain model only, and
 * the model owns the row <-> domain mapping (`fromEntity` / `toEntity`).
 */
@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.notifications.save(notification.toEntity());
    return Notification.fromEntity(saved);
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => Notification.fromEntity(row));
  }
}
