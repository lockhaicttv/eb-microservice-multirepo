import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '@demo/contracts';
import { PaymentEntity, PaymentStatus } from '../../database/payment.entity';

function toContractPayment(entity: PaymentEntity): Payment {
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

@Injectable()
export class PaymentStore {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const saved = await this.payments.save(
      this.payments.create({
        id: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        totalAmount: payment.totalAmount.toFixed(2),
        status: payment.status as PaymentStatus,
        reason: payment.reason ?? null,
      }),
    );
    return toContractPayment(saved);
  }

  async listByOrder(orderId: string): Promise<Payment[]> {
    const rows = await this.payments.find({
      where: { orderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(toContractPayment);
  }
}
