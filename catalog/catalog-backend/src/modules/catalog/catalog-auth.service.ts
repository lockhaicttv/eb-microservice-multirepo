import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE_NAME, AuthServiceClient, User } from '@demo/contracts';

export const AUTH_GRPC_URL = 'AUTH_GRPC_URL';

/**
 * Catalog-backend's own verification of the caller's identity.
 *
 * The BFF already resolves the token (it must, to build a GraphQL response), but
 * this service does not trust that. A BFF is a stateless facade that any client
 * can point at; treating its "the user is an event owner" as authoritative would
 * make the role check a client-side decision. So owner-scoped RPCs carry the raw
 * accessToken and it is re-validated here against auth-backend, which is the
 * identity authority and resolves the role from its own database.
 */
@Injectable()
export class CatalogAuthService implements OnModuleInit {
  private readonly logger = new Logger(CatalogAuthService.name);
  private client!: AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  /**
   * Resolve a token to a user, or null when it is missing/expired/unknown.
   *
   * A transport failure to auth-backend is deliberately NOT treated as "not
   * authenticated" being handled silently: it propagates, so the outage surfaces
   * as an error instead of a confusing 401. Failing closed here would mean an
   * auth outage looks like "you are logged out".
   */
  async identify(accessToken: string): Promise<User | null> {
    if (!accessToken) return null;
    const res = await firstValueFrom(this.client.validateToken({ accessToken }));
    if (!res.valid || !res.user) return null;
    return res.user;
  }
}
