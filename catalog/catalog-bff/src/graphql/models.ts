import { Field, ObjectType, InputType, Int, Float } from '@nestjs/graphql';

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

  /**
   * Empty string for platform-curated events, which have no human owner. Exposed
   * so the UI can label a listing without a second round trip; ownership itself
   * is never decided by the client.
   */
  @Field()
  ownerUserId: string;
}

/** Owner-submitted listing. Renamed to the event vocabulary the UI speaks. */
@InputType()
export class CreateEventInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  blurb?: string;

  @Field(() => Float)
  ticketPrice: number;

  @Field(() => Int)
  tickets: number;
}
