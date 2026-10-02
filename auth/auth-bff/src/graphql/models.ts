import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@demo/contracts';

/**
 * Mirrors the contract's string role as a GraphQL enum, so the frontend gets a
 * closed set to switch on. An unknown role from a newer backend still arrives as
 * a string; the gateway normalizes it to CUSTOMER before it gets here.
 */
export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  EVENT_OWNER = 'EVENT_OWNER',
  CUSTOMER = 'CUSTOMER',
}

registerEnumType(UserRoleEnum, { name: 'UserRole' });

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => UserRoleEnum)
  role: UserRole;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserModel)
  user: UserModel;
}