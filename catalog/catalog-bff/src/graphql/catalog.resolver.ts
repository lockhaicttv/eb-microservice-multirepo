import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { USER_ROLES } from '@demo/contracts';
import { AuthContext, ForbiddenError, RequestContext, extractToken } from './auth-context';
import { CatalogGatewayService } from './catalog-gateway.service';
import { CreateEventInput, EventModel } from './models';

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

  /**
   * Owner-only. The token is required here purely to answer 401/403 cleanly —
   * catalog-backend independently re-validates it before writing anything, so a
   * bug in this check cannot let an unprivileged caller create an event.
   */
  @Mutation(() => EventModel)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @Context() ctx: RequestContext,
  ): Promise<EventModel> {
    const token = await this.requireEventManager(ctx);

    const created = await this.catalog.createEvent(token, {
      title: input.title,
      blurb: input.blurb ?? '',
      ticketPrice: input.ticketPrice,
      tickets: input.tickets,
    });
    if (!created) throw new Error('EVENT_NOT_CREATED');
    return created;
  }

  /**
   * The owner's own listings. Scoped to the verified user on the backend, so a
   * crafted token cannot widen this to someone else's events.
   */
  @Query(() => [EventModel])
  async myEvents(@Context() ctx: RequestContext): Promise<EventModel[]> {
    const token = await this.requireEventManager(ctx);
    return this.catalog.listOwnerEvents(token);
  }

  /**
   * Identity first, capability second: a missing token must be a 401 and must not
   * reveal whether it would have been allowed. Returns the raw token because the
   * backend needs to verify it for itself rather than trust this check.
   */
  private async requireEventManager(ctx: RequestContext): Promise<string> {
    const token = extractToken(ctx);
    if (!token) throw new Error('UNAUTHORIZED');

    const auth = await AuthContext.from(ctx, (t) => this.catalog.validateToken(t));
    // Explicit pair rather than a role ranking: EVENT_OWNER and CUSTOMER are peers.
    if (!auth.has(USER_ROLES.EVENT_OWNER, USER_ROLES.ADMIN)) throw new ForbiddenError(auth.role);

    return token;
  }
}
