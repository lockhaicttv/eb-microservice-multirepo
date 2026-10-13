import { USER_ROLES, UserRole, isRole } from '@demo/contracts';
import { UserEntity } from '../entities/user.entity';

/**
 * User domain model.
 *
 * Mirrors the shared `@demo/contracts` `User` shape and is the projection the
 * auth service returns: the entity's `passwordHash` must never cross the gRPC
 * boundary, so it is simply absent here.
 *
 * An unrecognised stored role degrades to CUSTOMER rather than being passed
 * through, so a bad row can never grant extra capability.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
  ) {}

  static fromEntity(entity: UserEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.name,
      isRole(entity.role) ? entity.role : USER_ROLES.CUSTOMER,
    );
  }

  /**
   * Map back to a row. `passwordHash` is deliberately not part of the model, so
   * it is left unset — callers that persist a user are responsible for the
   * credential themselves (see AuthService.register).
   */
  toEntity(): UserEntity {
    const entity = new UserEntity();
    entity.id = this.id;
    entity.email = this.email;
    entity.name = this.name;
    entity.role = this.role;
    return entity;
  }
}
