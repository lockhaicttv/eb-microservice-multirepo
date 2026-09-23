import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationModel {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field()
  message: string;

  @Field()
  createdAt: string;
}