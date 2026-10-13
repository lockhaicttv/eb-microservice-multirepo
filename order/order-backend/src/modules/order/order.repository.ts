import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity } from '../../database/entities/order.entity';

/**
 * Order persistence adapter.
 *
 * Extends TypeORM's `Repository<OrderEntity>`, so every built-in operation
 * (`find`, `findOne`, `save`, `update`, `delete`, `createQueryBuilder`, ...) is
 * available directly on this class — no need to re-declare them. Only add a
 * method here when it is genuinely beyond TypeORM's API.
 */
@Injectable()
export class OrderRepository extends Repository<OrderEntity> {
  constructor(dataSource: DataSource) {
    super(OrderEntity, dataSource.createEntityManager());
  }
}
