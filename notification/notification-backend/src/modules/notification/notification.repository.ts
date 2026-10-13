import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';

/**
 * Notification persistence adapter.
 *
 * Extends TypeORM's `Repository<NotificationEntity>`, so `find`, `findOne`,
 * `save`, `update`, `delete`, ... are available directly. Add a method only when
 * it is genuinely beyond TypeORM's API.
 */
@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
  constructor(dataSource: DataSource) {
    super(NotificationEntity, dataSource.createEntityManager());
  }
}
