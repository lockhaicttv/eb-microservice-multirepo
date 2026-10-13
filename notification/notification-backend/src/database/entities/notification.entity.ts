import { Check, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

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
