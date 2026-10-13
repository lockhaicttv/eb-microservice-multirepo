import { NotificationEntity, NotificationType } from '../entities/notification.entity';

/**
 * Notification domain model.
 *
 * Mirrors the shared `@demo/contracts` `Notification` shape so it can be sent
 * over gRPC directly, while keeping the persistence entity out of the service
 * layer.
 */
export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly message: string,
    public readonly createdAt: string,
  ) {}

  static fromEntity(entity: NotificationEntity): Notification {
    return new Notification(
      entity.id,
      entity.userId,
      entity.type,
      entity.message,
      entity.createdAt.toISOString(),
    );
  }

  /** Timestamps are DB-managed, so they are omitted. */
  toEntity(): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = this.id;
    entity.userId = this.userId;
    entity.type = this.type;
    entity.message = this.message;
    return entity;
  }
}
