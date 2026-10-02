import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@demo/contracts';
import { ProductEntity } from '../../database/product.entity';

/**
 * Demo catalog is seeded as live EVENTS, each mapped onto the `Product` gRPC wire type
 * (name -> event title, price -> ticket price, stock -> tickets left / capacity).
 * Domestic contract stays `products`; the event/ticket vocabulary is exposed at the BFF
 * GraphQL layer. Event owners write new listings through `create`.
 */
@Injectable()
export class ProductsStore {
  private readonly logger = new Logger(ProductsStore.name);

  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
  ) {}

  /**
   * Public browse. `query` is a case-insensitive substring match across name,
   * description and id — matching the behaviour of the in-memory store this
   * replaced, so the Explore page keeps behaving the same.
   */
  async list(query?: string): Promise<Product[]> {
    const q = (query ?? '').trim();

    // Case-insensitive substring via `strpos(lower(x), lower($1))` rather than
    // LIKE/ILIKE: LIKE treats `%` and `_` as wildcards, so a user typing them in
    // the search box would silently widen the result set. `strpos` has no
    // metacharacters, and the term stays a bound parameter.
    const rows = q
      ? await this.products
          .createQueryBuilder('p')
          .where('strpos(lower(p.name), lower(:q)) > 0', { q })
          .orWhere('strpos(lower(p.description), lower(:q)) > 0', { q })
          .orWhere('strpos(lower(p.id::text), lower(:q)) > 0', { q })
          .orderBy('p.createdAt', 'ASC')
          .addOrderBy('p.id', 'ASC')
          .getMany()
      : await this.products.find({ order: { createdAt: 'ASC', id: 'ASC' } });

    return rows.map(toContractProduct);
  }

  /**
   * Ids are varchar, so there is no malformed-uuid case to defend against: any
   * unknown id is simply a miss.
   */
  async get(id: string): Promise<Product | undefined> {
    const row = await this.products.findOne({ where: { id } });
    return row ? toContractProduct(row) : undefined;
  }

  /**
   * Create an event owned by `ownerUserId`. Only reached after the caller has
   * been authenticated and authorized in the service layer, so the owner is
   * always the verified user — never a value taken from the request.
   */
  async create(input: { name: string; description: string; price: number; stock: number; ownerUserId: string }): Promise<Product> {
    const saved = await this.products.save(
      this.products.create({
        name: input.name,
        description: input.description,
        // numeric columns round-trip as strings; write a fixed 2-decimal string so
        // the stored value is exactly what a currency field should hold, rather
        // than whatever binary float expansion `Number.prototype.toString` emits.
        price: input.price.toFixed(2),
        stock: input.stock,
        ownerUserId: input.ownerUserId,
      }),
    );
    this.logger.log(`event ${saved.id} created by owner ${saved.ownerUserId}`);
    return toContractProduct(saved);
  }

  /** The owner dashboard: only this owner's listings, newest first. */
  async listByOwner(ownerUserId: string): Promise<Product[]> {
    const rows = await this.products.find({
      where: { ownerUserId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(toContractProduct);
  }
}

/**
 * Explicit projection onto the shared contract. The entity carries
 * `ownerUserId` as nullable while the wire type uses an empty string, so the
 * "platform-curated" case is a value every consumer can test for.
 */
function toContractProduct(entity: ProductEntity): Product {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    price: Number(entity.price),
    stock: entity.stock,
    ownerUserId: entity.ownerUserId ?? '',
  };
}
