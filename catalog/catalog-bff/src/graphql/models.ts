import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

/**
 * Event/ticket surface for the catalog. Maps 1:1 onto the `products` gRPC wire
 * (name -> title, price -> ticketPrice, stock -> ticketsLeft).
 */
@ObjectType()
export class EventModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  blurb: string;

  @Field(() => Float)
  ticketPrice: number;

  @Field(() => Int)
  ticketsLeft: number;
}
