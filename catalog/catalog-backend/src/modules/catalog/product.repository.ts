import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductEntity } from '../../database/entities/product.entity';

/**
 * Product persistence adapter.
 *
 * Extends TypeORM's `Repository<ProductEntity>`, so `find`, `findOne`, `save`,
 * `update`, `delete`, ... are available directly. The two methods below are the
 * only ones that are genuinely beyond TypeORM's API.
 */
@Injectable()
export class ProductRepository extends Repository<ProductEntity> {
  private readonly logger = new Logger(ProductRepository.name);

  constructor(dataSource: DataSource) {
    super(ProductEntity, dataSource.createEntityManager());
  }

  /**
   * Public browse. `query` is a case-insensitive substring match across name,
   * description and id — matching the behaviour of the in-memory store this
   * replaced, so the Explore page keeps behaving the same.
   *
   * Case-insensitive substring via `strpos(lower(x), lower($1))` rather than
   * LIKE/ILIKE: LIKE treats `%` and `_` as wildcards, so a user typing them in
   * the search box would silently widen the result set. `strpos` has no
   * metacharacters, and the term stays a bound parameter.
   */
  async list(query?: string): Promise<ProductEntity[]> {
    const q = (query ?? '').trim();

    if (!q) return this.find({ order: { createdAt: 'ASC', id: 'ASC' } });

    return this.createQueryBuilder('p')
      .where('strpos(lower(p.name), lower(:q)) > 0', { q })
      .orWhere('strpos(lower(p.description), lower(:q)) > 0', { q })
      .orWhere('strpos(lower(p.id::text), lower(:q)) > 0', { q })
      .orderBy('p.createdAt', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getMany();
  }

  /**
   * Create an event owned by `ownerUserId`. Only reached after the caller has
   * been authenticated and authorized in the service layer, so the owner is
   * always the verified user — never a value taken from the request.
   *
   * Named `createListing` rather than `create` to avoid colliding with
   * `Repository.create` (which builds an entity from a plain object).
   */
  async createListing(input: {
    name: string;
    description: string;
    price: number;
    stock: number;
    ownerUserId: string;
    startsAt?: Date | null;
  }): Promise<ProductEntity> {
    const entity = this.create();
    entity.name = input.name;
    entity.description = input.description;
    // numeric columns round-trip as strings; write a fixed 2-decimal string so
    // the stored value is exactly what a currency field should hold, rather
    // than whatever binary float expansion `Number.prototype.toString` emits.
    entity.price = input.price.toFixed(2);
    entity.stock = input.stock;
    entity.ownerUserId = input.ownerUserId;
    entity.startsAt = input.startsAt ?? null;
    const saved = await this.save(entity);
    this.logger.log(`event ${saved.id} created by owner ${saved.ownerUserId}`);
    return saved;
  }
}
