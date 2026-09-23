import { Args, Query, Resolver } from '@nestjs/graphql';
import { CatalogGatewayService } from './catalog-gateway.service';
import { EventModel } from './models';

@Resolver()
export class CatalogResolver {
  constructor(private readonly catalog: CatalogGatewayService) {}

  @Query(() => [EventModel])
  events(@Args('search', { nullable: true }) search?: string) {
    return this.catalog.listEvents(search);
  }

  @Query(() => EventModel, { nullable: true })
  event(@Args('id') id: string) {
    return this.catalog.event(id);
  }
}
