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

}
