import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../database/entities/payment.entity';
import { Payment } from '../../database/models/payment.model';

/**
 * Payment persistence adapter. Wraps the TypeORM repository with
 * payment-specific operations and keeps entity types out of the application
 * layer: callers work with the `Payment` domain model only, and the model owns
 * the row <-> domain mapping (`fromEntity` / `toEntity`).
 */
@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const saved = await this.payments.save(payment.toEntity());
    return Payment.fromEntity(saved);
  }

  async listByOrder(orderId: string): Promise<Payment[]> {
    const rows = await this.payments.find({
      where: { orderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => Payment.fromEntity(row));
  }
}
