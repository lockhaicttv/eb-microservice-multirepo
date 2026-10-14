import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { OrderCreatedEvent, PaymentDecisionEvent, TOPICS } from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { v7 as uuidv7 } from 'uuid';
import { OrkesService } from '../orkes/orkes.service';
import { PaymentEntity } from '../../database/entities/payment.entity';
import { Payment } from '../../database/models/payment.model';

export const PAYMENT_EVENT_GROUP = 'payment-events';

const MAX_ORDER_TOTAL = 10000;

import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly payments: PaymentRepository,
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

    const entity = new PaymentEntity();
    entity.id = uuidv7();
    entity.orderId = order.id;
    entity.userId = order.userId;
    entity.totalAmount = order.totalAmount.toFixed(2);
    entity.status = paid ? 'PAID' : 'DECLINED';
    entity.reason = paid ? null : `amount ${order.totalAmount} exceeds limit ${MAX_ORDER_TOTAL}`;
    const saved = await this.payments.save(entity);

    const topic = paid ? TOPICS.PAYMENT_CONFIRMED : TOPICS.PAYMENT_DECLINED;
    const message: PaymentDecisionEvent = {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: paid ? 'PAID' : 'DECLINED',
      reason: saved.reason ?? undefined,
    };

    await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
    this.logger.log(`payment for ${order.id}: ${saved.status} (${topic})`);
    void this.orkes.onPaymentDecision(message);
  }

  async listByOrder(orderId: string): Promise<Payment[]> {
    const rows = await this.payments.find({
      where: { orderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => Payment.fromEntity(row));
  }
}
