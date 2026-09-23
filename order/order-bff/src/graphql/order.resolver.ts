import { Args, Context, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { OrderGatewayService } from './order-gateway.service';
import { AuthGatewayService } from './auth-gateway.service';
import { PUB_SUB } from '../kafka/kafka-bridge.module';
import { OrderModel, OrderStatusUpdateModel, OrderTicketInput } from './models';
import { OrderStatusUpdatedEvent, TOPICS } from '@demo/contracts';

interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

@Resolver()
export class OrderResolver {
  constructor(
    private readonly orderGateway: OrderGatewayService,
    private readonly auth: AuthGatewayService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  private extractToken(ctx: RequestContext): string | null {
    const header = ctx.req.headers?.['authorization'];
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }

  @Mutation(() => OrderModel)
  async createOrder(
    @Context() ctx: RequestContext,
    @Args('tickets', { type: () => [OrderTicketInput] }) tickets: OrderTicketInput[],
  ) {
    const user = await this.getCurrentUser(ctx);
    return this.orderGateway.createOrder(user.id, tickets);
  }

  @Query(() => OrderModel, { nullable: true })
  order(@Args('orderId') orderId: string) {
    return this.orderGateway.getOrder(orderId);
  }

  @Query(() => [OrderModel])
  orders(@Context() ctx: RequestContext) {
    return this.getCurrentUser(ctx).then((u) => this.orderGateway.listOrders(u.id));
  }

  @Subscription(() => OrderStatusUpdateModel, {
    filter: (payload: { topic: string; payload: OrderStatusUpdatedEvent }, variables: { userId: string }) => {
      if (payload.topic !== TOPICS.ORDER_STATUS_UPDATED) return false;
      return payload.payload.userId === variables.userId;
    },
  })
  orderUpdated(@Args('userId') userId: string) {
    return this.pubsub.asyncIterator<{ topic: string; payload: OrderStatusUpdatedEvent }>([
      TOPICS.ORDER_STATUS_UPDATED,
    ]);
  }

  private async getCurrentUser(ctx: RequestContext) {
    const token = this.extractToken(ctx);
    if (!token) throw new Error('UNAUTHORIZED');
    const user = await this.auth.validateToken(token);
    if (!user) throw new Error('UNAUTHORIZED');
    return user;
  }
}
