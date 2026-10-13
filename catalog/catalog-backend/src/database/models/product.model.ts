import { ProductEntity } from '../entities/product.entity';

/**
 * Product (event listing) domain model.
 *
 * Mirrors the shared `@demo/contracts` `Product` shape so it can be sent over
 * gRPC directly, while keeping the persistence entity out of the service layer.
 * `ownerUserId` is `''` on the wire for platform-curated listings.
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly ownerUserId: string,
  ) {}

  static fromEntity(entity: ProductEntity): Product {
    return new Product(
      entity.id,
      entity.name,
      entity.description,
      Number(entity.price),
      entity.stock,
      entity.ownerUserId ?? '',
    );
  }

  /**
   * Map back to a row. `id` is assigned because new listings rely on the
   * database default (`gen_random_uuid()::text`) when it is left blank, so this
   * is only meaningful for a product that already has an id.
   */
  toEntity(): ProductEntity {
    const entity = new ProductEntity();
    entity.id = this.id;
    entity.name = this.name;
    entity.description = this.description;
    entity.price = this.price.toFixed(2);
    entity.stock = this.stock;
    entity.ownerUserId = this.ownerUserId || null;
    return entity;
  }
}
