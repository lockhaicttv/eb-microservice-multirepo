import { Check, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Notification } from '@demo/contracts';

export type NotificationType =
  | 'TICKETS_CONFIRMED'
  | 'TICKETS_DECLINED'
  | 'REFUND_ISSUED'
  | 'REFUND_REJECTED';

@Check(`type IN ('TICKETS_CONFIRMED','TICKETS_DECLINED','REFUND_ISSUED','REFUND_REJECTED')`)
@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  type!: NotificationType;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/**
 * Persistence <-> contract mapping lives next to the entity so callers never
 * hand-roll column conversions: `fromEntity` maps a persisted row to the wire
 * contract, `toEntity` maps the contract back to a row (timestamps are
 * DB-managed, so they are omitted).
 */
export function fromEntity(entity: NotificationEntity): Notification {
  return {
    id: entity.id,
    userId: entity.userId,
    type: entity.type as Notification['type'],
    message: entity.message,
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toEntity(notification: Notification): NotificationEntity {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationType,
    message: notification.message,
  } as NotificationEntity;
}
