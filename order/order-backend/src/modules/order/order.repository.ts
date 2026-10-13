import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@demo/contracts';
import { OrderEntity, OrderStatus, fromEntity, toEntity } from '../../database/order.entity';

/**
 * Order persistence adapter. Wraps the TypeORM repository with order-specific
 * operations and keeps entity types out of the application layer: callers work
 * with the `Order` contract only, and the entity owns the row <-> contract
 * mapping (`fromEntity` / `toEntity`).
 */
@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    await this.orders.save(toEntity(order));
    // Reload so generated columns (created_at on UPDATE, defaults) are always
    // populated; TypeORM does not reliably return @CreateDateColumn on update.
    const row = await this.orders.findOne({ where: { id: order.id } });
    if (!row) throw new Error(`order ${order.id} not found after save`);
    return fromEntity(row);
  }

  async get(id: string): Promise<Order | undefined> {
    const row = await this.orders.findOne({ where: { id } });
    return row ? fromEntity(row) : undefined;
  }

  async listByUser(userId: string): Promise<Order[]> {
    const rows = await this.orders.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(fromEntity);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.orders.update({ id }, { status });
  }
}
