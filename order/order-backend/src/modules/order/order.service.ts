import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Producer, EachMessagePayload, Kafka } from 'kafkajs';
import { firstValueFrom } from 'rxjs';
import {
  CATALOG_SERVICE_NAME,
  CatalogServiceClient,
  CreateOrderLine,
  Order,
  OrderCreatedEvent,
  OrderLine,
  OrderStatusUpdatedEvent,
  PaymentDecisionEvent,
  TOPICS,
} from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { OrkesService } from '../orkes/orkes.module';

export const ORDER_EVENT_GROUP = 'order-events';

@Injectable()
export class OrderStore {
  private readonly orders = new Map<string, Order>();
  private seq = 0;

  nextId(): string {
    this.seq++;
    return `o-${Date.now()}-${this.seq}`;
  }

  save(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  listByUser(userId: string): Order[] {
    return [...this.orders.values()].filter((o) => o.userId === userId);
  }
}

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);
  private catalog!: CatalogServiceClient;

  constructor(
    @Inject(OrderStore) private readonly orders: OrderStore,
    @Inject(CATALOG_SERVICE_NAME) private readonly clients: ClientGrpc,
    @Inject(KAFKA) private readonly kafka: Kafka,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
    private readonly orkes: OrkesService,
  ) {}

  onModuleInit() {
    this.catalog = this.clients.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
  }

  async onApplicationBootstrap() {
    await createConsumer(
      this.kafka,
      'demo-order-backend',
      ORDER_EVENT_GROUP,
      [TOPICS.PAYMENT_CONFIRMED, TOPICS.PAYMENT_DECLINED],
      (payload) => this.handlePaymentDecision(payload),
    );
    this.logger.log(`consuming ${TOPICS.PAYMENT_CONFIRMED}, ${TOPICS.PAYMENT_DECLINED}`);
  }

  async create(userId: string, lineItems: CreateOrderLine[]): Promise<Order> {
    if (!lineItems || lineItems.length === 0) {
      throw new Error('EMPTY_ORDER');
    }
    const normalized: OrderLine[] = [];
    for (const line of lineItems) {
      if (line.quantity <= 0) throw new Error('INVALID_QUANTITY');
      const res = await firstValueFrom(this.catalog.getProduct({ productId: line.productId }));
      const product = res.product;
      if (!product) throw new Error(`PRODUCT_NOT_FOUND:${line.productId}`);
      normalized.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: line.quantity,
      });
    }

    const totalAmount = normalized.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const order: Order = {
      id: this.orders.nextId(),
      userId,
      lineItems: normalized,
      totalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.orders.save(order);

    this.publish(TOPICS.ORDER_CREATED, { order } satisfies OrderCreatedEvent);
    this.logger.log(`order ${order.id} created with total ${order.totalAmount}`);
    void this.orkes.onOrderCreated(order);
    return order;
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  listByUser(userId: string): Order[] {
    return this.orders.listByUser(userId);
  }

  private async handlePaymentDecision(payload: EachMessagePayload) {
    const event: PaymentDecisionEvent = JSON.parse(payload.message.value!.toString());
    const order = this.orders.get(event.orderId);
    if (!order || order.status !== 'PENDING') return;

    const previousStatus = order.status;
    order.status = event.status === 'PAID' ? 'PAID' : 'DECLINED';
    this.orders.save(order);

    const update: OrderStatusUpdatedEvent = {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      previousStatus,
      totalAmount: order.totalAmount,
    };
    this.publish(TOPICS.ORDER_STATUS_UPDATED, update);
    this.logger.log(`order ${order.id} ${previousStatus} -> ${order.status}`);
    void this.orkes.onOrderUpdated(update);
  }

  private publish(topic: string, message: unknown) {
    this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] }).catch((err) => {
      this.logger.error(`publish ${topic} failed: ${(err as Error).message}`);
    });
  }
}