import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EachMessagePayload, Kafka, Producer } from 'kafkajs';
import {
  OrderCreatedEvent,
  Payment,
  PaymentDecisionEvent,
  TOPICS,
} from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { OrkesService } from '../orkes/orkes.module';

export const PAYMENT_EVENT_GROUP = 'payment-events';

const MAX_ORDER_TOTAL = 10000;

import { PaymentStore } from './payment.store';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly payments: PaymentStore,
    @Inject(KAFKA) private readonly kafka: Kafka,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
    private readonly orkes: OrkesService,
  ) {}

  async onModuleInit() {
    await createConsumer(
      this.kafka,
      'demo-payment-backend',
      PAYMENT_EVENT_GROUP,
      [TOPICS.ORDER_CREATED],
      (payload) => this.handleOrderCreated(payload),
    );
    this.logger.log(`consuming ${TOPICS.ORDER_CREATED}`);
  }

  private async handleOrderCreated(payload: EachMessagePayload) {
    const event: OrderCreatedEvent = JSON.parse(payload.message.value!.toString());
    const { order } = event;

    const paid = order.totalAmount <= MAX_ORDER_TOTAL;
    const record: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: paid ? 'PAID' : 'DECLINED',
      reason: paid ? undefined : `amount ${order.totalAmount} exceeds limit ${MAX_ORDER_TOTAL}`,
      createdAt: new Date().toISOString(),
    };
    await this.payments.save(record);

    const topic = paid ? TOPICS.PAYMENT_CONFIRMED : TOPICS.PAYMENT_DECLINED;
    const message: PaymentDecisionEvent = {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: paid ? 'PAID' : 'DECLINED',
      reason: record.reason,
    };

    await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
    this.logger.log(`payment for ${order.id}: ${record.status} (${topic})`);
    void this.orkes.onPaymentDecision(message);
  }

  async listByOrder(orderId: string): Promise<Payment[]> {
    return this.payments.listByOrder(orderId);
  }
}