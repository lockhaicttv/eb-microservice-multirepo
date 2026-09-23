import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserModel)
  user: UserModel;
}