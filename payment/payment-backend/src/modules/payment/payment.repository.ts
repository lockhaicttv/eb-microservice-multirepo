import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '@demo/contracts';
import { PaymentEntity, fromEntity, toEntity } from '../../database/payment.entity';

/**
 * Payment persistence adapter. Wraps the TypeORM repository with
 * payment-specific operations and keeps entity types out of the application
 * layer: callers work with the `Payment` contract only, and the entity owns the
 * row <-> contract mapping (`fromEntity` / `toEntity`).
 */
@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const saved = await this.payments.save(toEntity(payment));
    return fromEntity(saved);
  }

  async listByOrder(orderId: string): Promise<Payment[]> {
    const rows = await this.payments.find({
      where: { orderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(fromEntity);
  }
}
