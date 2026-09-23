import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ORDER_SERVICE_NAME, Order, OrderServiceClient } from '@demo/contracts';
import { OrderModel } from './models';

export interface TicketLineInput {
  eventId: string;
  quantity: number;
}

@Injectable()
export class OrderGatewayService implements OnModuleInit {
  private client!: OrderServiceClient;

  constructor(@Inject(ORDER_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<OrderServiceClient>(ORDER_SERVICE_NAME);
  }

  private toOrderModel(order: Order): OrderModel {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      tickets: (order.lineItems ?? []).map((l) => ({
        eventId: l.productId,
        eventName: l.productName,
        ticketPrice: l.unitPrice,
        quantity: l.quantity,
      })),
    };
  }

  async createOrder(userId: string, tickets: TicketLineInput[]) {
    const res = await firstValueFrom(
      this.client.createOrder({
        userId,
        lineItems: tickets.map((t) => ({ productId: t.eventId, quantity: t.quantity })),
      }),
    );
    if (!res.order) throw new Error('createOrder returned no order');
    return this.toOrderModel(res.order);
  }

  async getOrder(orderId: string) {
    const res = await firstValueFrom(this.client.getOrder({ orderId }));
    return res.order ? this.toOrderModel(res.order) : null;
  }

  async listOrders(userId: string) {
    const res = await firstValueFrom(this.client.listOrders({ userId }));
    return res.orders.map((o) => this.toOrderModel(o));
  }
}
