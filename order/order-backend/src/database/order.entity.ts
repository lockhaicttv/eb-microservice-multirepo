import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

export type OrderStatus = "PENDING" | "PAID" | "DECLINED" | "REFUNDED";

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
@Entity({ name: "orders" })
@Index("idx_orders_user_id", ["userId"])
@Index("idx_orders_created_at", ["createdAt"])
export class OrderEntity {
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 20 })
  status!: OrderStatus;

  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ name: "line_items", type: "jsonb" })
  lineItems!: OrderLineEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
