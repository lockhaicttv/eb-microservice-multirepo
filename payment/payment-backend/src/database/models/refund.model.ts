import { RefundEntity, RefundStatus } from '../entities/refund.entity';

/**
 * Refund domain model.
 *
 * There is no `@demo/contracts` Refund message yet (the refund surface is still
 * being built in the Orkes `refund_flow`), so this mirrors the entity shape
 * minus the DB-managed `updatedAt`.
 */
export class Refund {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly status: RefundStatus,
    public readonly reason: string | undefined,
    public readonly createdAt: string,
  ) {}

  static fromEntity(entity: RefundEntity): Refund {
    return new Refund(
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
  toEntity(): RefundEntity {
    const entity = new RefundEntity();
    entity.id = this.id;
    entity.orderId = this.orderId;
    entity.userId = this.userId;
    entity.totalAmount = this.totalAmount.toFixed(2);
    entity.status = this.status;
    entity.reason = this.reason ?? null;
    return entity;
  }
}
