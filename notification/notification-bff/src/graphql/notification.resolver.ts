import { Args, Context, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { NotificationGatewayService } from './notification-gateway.service';
import { AuthGatewayService } from './auth-gateway.service';
import { PUB_SUB } from '../kafka/kafka-bridge.module';
import { NotificationModel } from './models';
import { NotificationCreatedEvent, TOPICS } from '@demo/contracts';

interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

@Resolver()
export class NotificationResolver {
  constructor(
    private readonly notificationGateway: NotificationGatewayService,
    private readonly auth: AuthGatewayService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  private extractToken(ctx: RequestContext): string | null {
    const header = ctx.req.headers?.['authorization'];
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }

  @Query(() => [NotificationModel])
  notifications(@Context() ctx: RequestContext) {
    return this.getCurrentUser(ctx).then((u) => this.notificationGateway.listNotifications(u.id));
  }

  @Subscription(() => NotificationModel, {
    filter: (payload: { topic: string; payload: NotificationCreatedEvent }, variables: { userId: string }) => {
      if (payload.topic !== TOPICS.NOTIFICATION_CREATED) return false;
      return payload.payload.notification.userId === variables.userId;
    },
  })
  notificationCreated(@Args('userId') userId: string) {
    return this.pubsub.asyncIterator<{ topic: string; payload: NotificationCreatedEvent }>([
      TOPICS.NOTIFICATION_CREATED,
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