import { ProductEntity } from '../entities/product.entity';

/**
 * Product (event listing) domain model.
 *
 * Mirrors the shared `@demo/contracts` `Product` shape so it can be sent over
 * gRPC directly, while keeping the persistence entity out of the service layer.
 * `ownerUserId` is `''` on the wire for platform-curated listings, and
 * `startsAt` is `''` when the event's start time is unknown.
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly ownerUserId: string,
    public readonly startsAt: string,
  ) {}

  static fromEntity(entity: ProductEntity): Product {
    return new Product(
      entity.id,
      entity.name,
      entity.description,
      Number(entity.price),
      entity.stock,
      entity.ownerUserId ?? '',
      entity.startsAt ? entity.startsAt.toISOString() : '',
    );
  }

}
