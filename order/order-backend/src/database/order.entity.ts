import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '@demo/contracts';

export type OrderStatus = 'PENDING' | 'PAID' | 'DECLINED' | 'REFUNDED';

export interface OrderLineEntity {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Order aggregate. Orders are stored in the `order` database; each order
 * belongs to a specific user (reference to auth user id). The line items are
 * embedded as JSONB because the order is immutable history and we don't need to
 * query across individual line items.
 */
@Check(`status IN ('PENDING','PAID','DECLINED','REFUNDED')`)
@Entity({ name: 'orders' })
@Index('idx_orders_user_id', ['userId'])
@Index('idx_orders_created_at', ['createdAt'])
export class OrderEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: OrderStatus;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ name: 'line_items', type: 'jsonb' })
  lineItems!: OrderLineEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/**
 * Persistence <-> contract mapping lives next to the entity: the entity owns
 * its own (de)serialization so callers never hand-roll column conversions.
 * `fromEntity` maps a persisted row to the wire contract; `toEntity` maps the
 * contract back to a row (timestamps are DB-managed, so they are omitted).
 */
export function fromEntity(entity: OrderEntity): Order {
  return {
    id: entity.id,
    userId: entity.userId,
    status: entity.status as Order['status'],
    totalAmount: Number(entity.totalAmount),
    lineItems: entity.lineItems.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    })),
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toEntity(order: Order): OrderEntity {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status as OrderStatus,
    totalAmount: order.totalAmount.toFixed(2),
    lineItems: order.lineItems.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    })),
  } as OrderEntity;
}
