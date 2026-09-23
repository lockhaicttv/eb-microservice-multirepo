import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class PaymentModel {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field()
  userId: string;

  @Field(() => Float)
  totalAmount: number;

  @Field()
  status: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  createdAt: string;
}