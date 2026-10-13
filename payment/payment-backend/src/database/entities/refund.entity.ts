import { Check, Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type RefundStatus = 'ISSUED' | 'FAILED';

/**
 * Refund aggregate. A refund is a distinct money movement from the original
 * payment, so it lives in its own table keyed by `order_id`. The primary key is
 * the `refundId` the `refund_issue_payment` Orkes task reports back to the
 * workflow (consumed by `refund_notify_refunded`).
 */
@Check(`status IN ('ISSUED','FAILED')`)
@Entity({ name: 'refunds' })
@Index('idx_refunds_order_id', ['orderId'])
export class RefundEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'order_id', type: 'varchar', length: 64 })
  orderId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: RefundStatus;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
