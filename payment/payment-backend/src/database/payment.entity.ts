import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Payment } from '@demo/contracts';

export type PaymentStatus = 'PENDING' | 'PAID' | 'DECLINED';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'order_id', type: 'varchar', length: 64 })
  orderId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

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
export function fromEntity(entity: PaymentEntity): Payment {
  return {
    id: entity.id,
    orderId: entity.orderId,
    userId: entity.userId,
    totalAmount: Number(entity.totalAmount),
    status: entity.status as Payment['status'],
    reason: entity.reason ?? undefined,
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toEntity(payment: Payment): PaymentEntity {
  return {
    id: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    // numeric round-trips as a string; write a fixed 2-decimal string.
    totalAmount: payment.totalAmount.toFixed(2),
    status: payment.status as PaymentStatus,
    reason: payment.reason ?? null,
  } as PaymentEntity;
}
