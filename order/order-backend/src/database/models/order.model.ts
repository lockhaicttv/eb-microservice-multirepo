import { OrderLine } from '@demo/contracts';
import { OrderEntity, OrderStatus } from '../entities/order.entity';

/**
 * Order domain model.
 *
 * This is the type the application layer (repository, service, controller) works
 * with. It mirrors the shared `@demo/contracts` `Order` shape so it can be sent
 * over gRPC directly, while keeping the persistence entity — and its column-level
 * details — out of the service layer.
 *
 * Fields are readonly: an order's lifecycle is expressed as a new value
 * (`withStatus`) rather than an in-place mutation.
 */
export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly totalAmount: number,
    public readonly lineItems: OrderLine[],
    public readonly createdAt: string,
  ) {}

  /** Map a persisted row into the domain model. */
  static fromEntity(entity: OrderEntity): Order {
    return new Order(
      entity.id,
      entity.userId,
      entity.status,
      Number(entity.totalAmount),
      entity.lineItems.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
      entity.createdAt.toISOString(),
    );
  }

  /** Return a copy of this order in a new state (orders are append-only history). */
  withStatus(status: OrderStatus): Order {
    return new Order(this.id, this.userId, status, this.totalAmount, this.lineItems, this.createdAt);
  }
}
