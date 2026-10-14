import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RefundEntity } from '../../database/entities/refund.entity';

/**
 * Refund persistence adapter.
 *
 * Extends TypeORM's `Repository<RefundEntity>`, so `find`, `findOne`, `save`,
 * `update`, `delete`, ... are available directly. Add a method only when it is
 * genuinely beyond TypeORM's API.
 */
@Injectable()
export class RefundRepository extends Repository<RefundEntity> {
  constructor(dataSource: DataSource) {
    super(RefundEntity, dataSource.createEntityManager());
  }
}
