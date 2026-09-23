import { Field, ObjectType, InputType, Int, Float } from '@nestjs/graphql';

@InputType()
export class OrderTicketInput {
  @Field()
  eventId: string;

  @Field(() => Int)
  quantity: number;
}

@ObjectType()
export class OrderTicketModel {
  @Field()
  eventId: string;

  @Field()
  eventName: string;

  @Field(() => Float)
  ticketPrice: number;

  @Field(() => Int)
  quantity: number;
}

@ObjectType()
export class OrderModel {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field(() => [OrderTicketModel])
  tickets: OrderTicketModel[];

  @Field(() => Float)
  totalAmount: number;

  @Field()
  status: string;

  @Field()
  createdAt: string;
}

@ObjectType()
export class OrderStatusUpdateModel {
  @Field()
  orderId: string;

  @Field()
  userId: string;

  @Field()
  status: string;

  @Field()
  previousStatus: string;

  @Field(() => Float)
  totalAmount: number;
}
