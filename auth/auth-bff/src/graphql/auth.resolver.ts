import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { USER_ROLES } from '@demo/contracts';
import { AuthGatewayService } from './auth-gateway.service';
import { AuthContext, RequestContext, extractToken } from './auth-context';
import { AuthPayload, UserModel, UserRoleEnum } from './models';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthGatewayService) {}

  private context(ctx: RequestContext): Promise<AuthContext> {
    return AuthContext.from(ctx, (token) => this.auth.validateToken(token));
  }

  @Mutation(() => AuthPayload)
  async register(@Args('email') email: string, @Args('password') password: string, @Args('name') name: string) {
    const res = await this.auth.register(email, password, name);
    // Every new account is a CUSTOMER; there is deliberately no `role` argument
    // so a client cannot register itself as an owner or an admin.
    return { accessToken: res.accessToken, user: res.user! };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('email') email: string, @Args('password') password: string) {
    const res = await this.auth.login(email, password);
    return { accessToken: res.accessToken, user: res.user! };
  }

  /**
   * The signed-in user, including the role the frontend uses to decide which
   * navigation and features to render. Returns null when there is no token, so
   * the app can render its logged-out state instead of erroring.
   */
  @Query(() => UserModel, { nullable: true })
  async me(@Context() ctx: RequestContext): Promise<UserModel | null> {
    const token = extractToken(ctx);
    if (!token) return null;
    return this.auth.validateToken(token);
  }

  /**
   * Admin only. The BFF checks the role for a fast, friendly rejection, and the
   * backend independently re-verifies the same token — the BFF check is UX, not
   * the security boundary.
   */
  @Query(() => [UserModel])
  async users(@Context() ctx: RequestContext): Promise<UserModel[]> {
    const context = await this.context(ctx);
    context.assert(USER_ROLES.ADMIN);
    return this.auth.listUsers(extractToken(ctx)!);
  }

  /** Admin only. Promote or demote a user between CUSTOMER and EVENT_OWNER. */
  @Mutation(() => UserModel)
  async setUserRole(
    @Context() ctx: RequestContext,
    @Args('userId') userId: string,
    // Must name the enum type explicitly: with @nestjs/graphql a bare
    // `role: UserRole` is inferred as String, which would let a client pass
    // "SUPERUSER" and silently widen the role vocabulary.
    @Args('role', { type: () => UserRoleEnum }) role: UserRoleEnum,
  ): Promise<UserModel> {
    const context = await this.context(ctx);
    context.assert(USER_ROLES.ADMIN);

    const updated = await this.auth.setUserRole(extractToken(ctx)!, userId, role);
    if (!updated) throw new Error('USER_NOT_FOUND');
    return updated;
  }
}