import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Producer, EachMessagePayload, Kafka } from 'kafkajs';
import { firstValueFrom } from 'rxjs';
import {
  CATALOG_SERVICE_NAME,
  CatalogServiceClient,
  CreateOrderLine,
  OrderCreatedEvent,
  OrderLine,
  OrderStatusUpdatedEvent,
  PaymentDecisionEvent,
  TOPICS,
} from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { OrkesService } from '../orkes/orkes.service';
import { v7 as uuidv7 } from 'uuid';
import { OrderEntity } from '../../database/entities/order.entity';
import { Order } from '../../database/models/order.model';
import { OrderRepository } from './order.repository';

export const ORDER_EVENT_GROUP = 'order-events';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);
  private catalog!: CatalogServiceClient;

  constructor(
    private readonly orders: OrderRepository,
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

    const entity = new OrderEntity();
    entity.id = uuidv7();
    entity.userId = userId;
    entity.status = 'PENDING';
    entity.totalAmount = totalAmount.toFixed(2);
    entity.lineItems = normalized;
    const saved = await this.orders.save(entity);

    const order = Order.fromEntity(saved);
    this.publish(TOPICS.ORDER_CREATED, { order } satisfies OrderCreatedEvent);
    this.logger.log(`order ${order.id} created with total ${order.totalAmount}`);
    void this.orkes.onOrderCreated(order);
    return order;
  }

  async get(id: string): Promise<Order | undefined> {
    const row = await this.orders.findOne({ where: { id } });
    return row ? Order.fromEntity(row) : undefined;
  }

  async listByUser(userId: string): Promise<Order[]> {
    const rows = await this.orders.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => Order.fromEntity(row));
  }

  private async handlePaymentDecision(payload: EachMessagePayload) {
    const event: PaymentDecisionEvent = JSON.parse(payload.message.value!.toString());
    const row = await this.orders.findOne({ where: { id: event.orderId } });
    if (!row || row.status !== 'PENDING') return;

    const previousStatus = row.status;
    row.status = event.status === 'PAID' ? 'PAID' : 'DECLINED';
    const saved = await this.orders.save(row);

    const update: OrderStatusUpdatedEvent = {
      orderId: saved.id,
      userId: saved.userId,
      status: saved.status,
      previousStatus,
      totalAmount: Number(saved.totalAmount),
    };
    this.publish(TOPICS.ORDER_STATUS_UPDATED, update);
    this.logger.log(`order ${saved.id} ${previousStatus} -> ${saved.status}`);
    void this.orkes.onOrderUpdated(update);
  }

  private publish(topic: string, message: unknown) {
    this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] }).catch((err) => {
      this.logger.error(`publish ${topic} failed: ${(err as Error).message}`);
    });
  }
}
