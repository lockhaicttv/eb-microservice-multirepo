import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@demo/contracts';
import { OrderEntity, OrderStatus } from '../../database/order.entity';

function toContractOrder(entity: OrderEntity): Order {
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

@Injectable()
export class OrderStore {
  private seq = 0;

  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
  ) {}

  nextId(): string {
    this.seq++;
    return `o-${Date.now()}-${this.seq}`;
  }

  async save(order: Order): Promise<Order> {
    const saved = await this.orders.save(
      this.orders.create({
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
      }),
    );
    return toContractOrder(saved);
  }

  async get(id: string): Promise<Order | undefined> {
    const row = await this.orders.findOne({ where: { id } });
    return row ? toContractOrder(row) : undefined;
  }

  async listByUser(userId: string): Promise<Order[]> {
    const rows = await this.orders.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(toContractOrder);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.orders.update({ id }, { status });
  }
}
