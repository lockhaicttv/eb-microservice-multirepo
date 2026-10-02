import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Catalog-owned table. The `catalog` database belongs to this service alone — no
 * other backend reads or writes it.
 *
 * `id` is a varchar, not a uuid, because the demo's seeded listings are addressed
 * as `e-1`..`e-5` by the frontend (artwork lookup) and by any order line already
 * written against those ids. New rows fall back to a uuid at the database level,
 * so ids stay unique without every writer having to invent one.
 *
 * `ownerUserId` is a plain uuid reference to an auth-backend user id, NOT a
 * foreign key: the `auth` and `catalog` databases are separate Postgres schemas
 * in one server, and crossing that boundary with an FK would couple the two
 * services' migration lifecycles. Ownership is advisory (display + filtering),
 * so a dangling id is harmless — and catalog-backend re-validates the caller's
 * token on every write, so the value is never taken on trust from a client.
 *
 * NULL means "platform-curated": the seeded demo listings have no human owner
 * and therefore show up in nobody's owner dashboard.
 */
@Entity({ name: 'products' })
export class ProductEntity {
  // `!` because these are populated by Postgres, not assigned in a constructor.
  // This is the standard TypeORM + `strict` idiom.

  @PrimaryColumn({ type: 'varchar', length: 64, default: () => `gen_random_uuid()::text` })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  /**
   * Ticket price. `numeric` rather than `double precision` because money must
   * round-trip exactly — a float sum of many prices drifts. TypeORM surfaces
   * numeric as a string, so the service parses it on the way out.
   */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  /**
   * Tickets available. CHECK-constrained in the migration to `>= 0`; stock is
   * owned by this service, so the invariant lives in the schema.
   */
  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Index('idx_products_owner_user_id')
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
