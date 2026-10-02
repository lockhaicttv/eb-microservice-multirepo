import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { USER_ROLES, UserRole } from '@demo/contracts';

/**
 * Auth-owned table. The `auth` database belongs to this service alone — no other
 * backend reads or writes it; everyone else resolves identity over gRPC.
 *
 * `passwordHash` is bcrypt, never the plaintext. It is deliberately NOT part of
 * the shared `@demo/contracts` User message: that contract carries id/email/name
 * only, so the hash cannot leak across the gRPC wire.
 */
@Entity({ name: 'users' })
export class UserEntity {
  // `!` because these are populated by Postgres, not assigned in a constructor.
  // This is the standard TypeORM + `strict` idiom.

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_users_email', { unique: true })
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  /**
   * ADMIN | EVENT_OWNER | CUSTOMER. Enforced as a DB CHECK constraint by the
   * migration, so an invalid role cannot be written even by a buggy code path.
   *
   * Roles are stored, never taken from the client: registration always creates
   * CUSTOMER, and promotion is an admin-only operation (see SetUserRole).
   */
  @Column({ type: 'varchar', length: 20, default: USER_ROLES.CUSTOMER })
  role!: UserRole;

  @Column({ name: 'password_hash', type: 'varchar', length: 120 })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}