import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  CATALOG_SERVICE_NAME,
  CatalogServiceClient,
  Product,
  USER_ROLES,
  User,
  isRole,
} from '@demo/contracts';
import { AUTH_GRPC_CLIENT, CATALOG_GRPC_CLIENT } from '../clients/grpc-client.tokens';

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
export class CatalogGatewayService {
  private readonly logger = new Logger(CatalogGatewayService.name);
  private readonly client: CatalogServiceClient;
  private readonly auth: AuthServiceClient;

  constructor(
    @Inject(CATALOG_GRPC_CLIENT) catalogProxy: ClientGrpcProxy,
    @Inject(AUTH_GRPC_CLIENT) authProxy: ClientGrpcProxy,
  ) {
    this.client = catalogProxy.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
    this.auth = authProxy.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
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
   *
   * An invalid token is answered by auth-backend as a gRPC `UNAUTHENTICATED`
   * error, not as `{ valid: false }`. That is still an authentication failure,
   * so it collapses to `null` here and the caller raises UNAUTHORIZED — letting
   * the RpcException through would surface as a 500 "Internal server error",
   * telling an unauthenticated caller far more than it should know and giving
   * the frontend no 401 to branch on.
   */
  async validateToken(accessToken: string): Promise<User | null> {
    try {
      const res = await firstValueFrom(this.auth.validateToken({ accessToken }));
      if (!res.valid || !res.user) return null;
      return withSafeRole(res.user);
    } catch (err) {
      if (isUnauthenticated(err)) {
        this.logger.debug(`token rejected by auth-backend: ${describe(err)}`);
        return null;
      }
      throw err;
    }
  }
}

/** gRPC status 16. Auth failures are expected here, everything else is a fault. */
function isUnauthenticated(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 16;
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Fail closed: a role this build does not recognise degrades to CUSTOMER, so a
 * newer backend cannot grant an older BFF (or a hand-crafted token) more
 * capability than the contract it was built against.
 */
function withSafeRole(user: User): User {
  return { ...user, role: isRole(user.role) ? user.role : USER_ROLES.CUSTOMER };
}
