import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGatewayService } from './auth-gateway.service';
import { AuthPayload, UserModel } from './models';

interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthGatewayService) {}

  private extractToken(ctx: RequestContext): string | null {
    const header = ctx.req.headers?.['authorization'];
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }

  @Mutation(() => AuthPayload)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
  ) {
    const res = await this.auth.register(email, password, name);
    return { accessToken: res.accessToken, user: res.user! };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('email') email: string, @Args('password') password: string) {
    const res = await this.auth.login(email, password);
    return { accessToken: res.accessToken, user: res.user! };
  }

  @Query(() => UserModel, { nullable: true })
  async me(@Context() ctx: RequestContext) {
    const token = this.extractToken(ctx);
    if (!token) return null;
    return this.auth.validateToken(token);
  }
}