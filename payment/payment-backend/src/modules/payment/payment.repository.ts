import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentEntity } from '../../database/entities/payment.entity';

/**
 * Payment persistence adapter.
 *
 * Extends TypeORM's `Repository<PaymentEntity>`, so `find`, `findOne`, `save`,
 * `update`, `delete`, ... are available directly. Add a method only when it is
 * genuinely beyond TypeORM's API.
 */
@Injectable()
export class PaymentRepository extends Repository<PaymentEntity> {
  constructor(dataSource: DataSource) {
    super(PaymentEntity, dataSource.createEntityManager());
  }
}
