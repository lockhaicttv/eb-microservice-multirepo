import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CATALOG_SERVICE_NAME, CatalogServiceClient, Product } from '@demo/contracts';

export type EventDto = {
  id: string;
  title: string;
  blurb: string;
  ticketPrice: number;
  ticketsLeft: number;
};

function toEventDto(p: Product): EventDto {
  return {
    id: p.id,
    title: p.name,
    blurb: p.description,
    ticketPrice: p.price,
    ticketsLeft: p.stock,
  };
}

@Injectable()
export class CatalogGatewayService implements OnModuleInit {
  private client!: CatalogServiceClient;

  constructor(@Inject(CATALOG_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
  }

  async listEvents(search?: string): Promise<EventDto[]> {
    const res = await firstValueFrom(this.client.listProducts({ query: search ?? '' }));
    return res.products.map(toEventDto);
  }

  async event(id: string): Promise<EventDto | null> {
    const res = await firstValueFrom(this.client.getProduct({ productId: id }));
    return res.product ? toEventDto(res.product) : null;
  }
}
