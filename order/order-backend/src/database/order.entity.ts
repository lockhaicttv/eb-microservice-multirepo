import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type OrderStatus = 'PENDING' | 'PAID' | 'DECLINED';

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
@Entity({ name: 'orders' })
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
