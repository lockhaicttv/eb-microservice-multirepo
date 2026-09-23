import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PaymentGatewayService } from './payment-gateway.service';
import { AuthGatewayService } from './auth-gateway.service';
import { PaymentModel } from './models';

interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

@Resolver()
export class PaymentResolver {
  constructor(
    private readonly paymentGateway: PaymentGatewayService,
    private readonly auth: AuthGatewayService,
  ) {}

  @Query(() => [PaymentModel])
  async payments(@Context() ctx: RequestContext, @Args('orderId') orderId: string) {
    const token = this.extractToken(ctx);
    if (!token) throw new Error('UNAUTHORIZED');
    const user = await this.auth.validateToken(token);
    if (!user) throw new Error('UNAUTHORIZED');
    return this.paymentGateway.listPayments(orderId);
  }

  private extractToken(ctx: RequestContext): string | null {
    const header = ctx.req.headers?.['authorization'];
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }
}