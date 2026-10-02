import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  CATALOG_SERVICE_NAME,
  CatalogServiceClient,
  Product,
  USER_ROLES,
  User,
  UserRole,
  isRole,
} from '@demo/contracts';

export type EventDto = {
  id: string;
  title: string;
  blurb: string;
  ticketPrice: number;
  ticketsLeft: number;
  /** Empty for platform-curated events; the id of the owner otherwise. */
  ownerUserId: string;
};

function toEventDto(p: Product): EventDto {
  return {
    id: p.id,
    title: p.name,
    blurb: p.description,
    ticketPrice: p.price,
    ticketsLeft: p.stock,
    ownerUserId: p.ownerUserId ?? '',
  };
}

@Injectable()
export class CatalogGatewayService implements OnModuleInit {
  private client!: CatalogServiceClient;
  private auth!: AuthServiceClient;

  constructor(@Inject(CATALOG_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
    this.auth = this.clients.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async listEvents(search?: string): Promise<EventDto[]> {
    const res = await firstValueFrom(this.client.listProducts({ query: search ?? '' }));
    return (res.products ?? []).map(toEventDto);
  }

  async event(id: string): Promise<EventDto | null> {
    const res = await firstValueFrom(this.client.getProduct({ productId: id }));
    return res.product ? toEventDto(res.product) : null;
  }

  /**
   * The raw bearer token, forwarded to catalog-backend.
   *
   * Not the user id: the backend must resolve the caller itself. Handing it an id
   * would mean trusting this BFF's identity check, and this BFF is just another
   * process the client chooses to talk to.
   */
  async createEvent(
    accessToken: string,
    input: { title: string; blurb: string; ticketPrice: number; tickets: number },
  ): Promise<EventDto | null> {
    const res = await firstValueFrom(
      this.client.createProduct({
        accessToken,
        name: input.title,
        description: input.blurb,
        price: input.ticketPrice,
        stock: input.tickets,
      }),
    );
    return res.product ? toEventDto(res.product) : null;
  }

  async listOwnerEvents(accessToken: string): Promise<EventDto[]> {
    const res = await firstValueFrom(this.client.listOwnerProducts({ accessToken }));
    return (res.products ?? []).map(toEventDto);
  }

  /**
   * Resolve a token to the current user, role included. The JWT payload carries
   * no role claim, so a promotion or demotion shows up on the very next request
   * instead of persisting until the token expires.
   */
  async validateToken(accessToken: string): Promise<User | null> {
    const res = await firstValueFrom(this.auth.validateToken({ accessToken }));
    if (!res.valid || !res.user) return null;
    return withSafeRole(res.user);
  }
}

/**
 * Fail closed: a role this build does not recognise degrades to CUSTOMER, so a
 * newer backend cannot grant an older BFF (or a hand-crafted token) more
 * capability than the contract it was built against.
 */
function withSafeRole(user: User): User {
  return { ...user, role: isRole(user.role) ? user.role : USER_ROLES.CUSTOMER };
}
