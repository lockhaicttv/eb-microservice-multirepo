import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';

/**
 * Payment domain model.
 *
 * Mirrors the shared `@demo/contracts` `Payment` shape so it can be sent over
 * gRPC directly, while keeping the persistence entity out of the service layer.
 */
export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly status: PaymentStatus,
    public readonly reason: string | undefined,
    public readonly createdAt: string,
  ) {}

  static fromEntity(entity: PaymentEntity): Payment {
    return new Payment(
      entity.id,
      entity.orderId,
      entity.userId,
      Number(entity.totalAmount),
      entity.status,
      entity.reason ?? undefined,
      entity.createdAt.toISOString(),
    );
  }

  /** Timestamps are DB-managed, so they are omitted. */
  toEntity(): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = this.id;
    entity.orderId = this.orderId;
    entity.userId = this.userId;
    // numeric round-trips as a string; write a fixed 2-decimal string.
    entity.totalAmount = this.totalAmount.toFixed(2);
    entity.status = this.status;
    entity.reason = this.reason ?? null;
    return entity;
  }
}
