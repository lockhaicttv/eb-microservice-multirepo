import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EachMessagePayload, Kafka, Producer } from 'kafkajs';
import {
  Notification,
  NotificationCreatedEvent,
  PaymentDecisionEvent,
  TOPICS,
} from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { OrkesService } from '../orkes/orkes.module';

export const NOTIFICATION_EVENT_GROUP = 'notification-events';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notifications = new Map<string, Notification>();

  constructor(
    @Inject(KAFKA) private readonly kafka: Kafka,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
    private readonly orkes: OrkesService,
  ) {}

  async onModuleInit() {
    await createConsumer(
      this.kafka,
      'demo-notification-backend',
      NOTIFICATION_EVENT_GROUP,
      [TOPICS.PAYMENT_CONFIRMED, TOPICS.PAYMENT_DECLINED],
      (payload) => this.handlePayment(payload),
    );
    this.logger.log(`consuming ${TOPICS.PAYMENT_CONFIRMED}, ${TOPICS.PAYMENT_DECLINED}`);
  }

  private async handlePayment(payload: EachMessagePayload) {
    const event: PaymentDecisionEvent = JSON.parse(payload.message.value!.toString());
    const paid = event.status === 'PAID';
    const record: Notification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: event.userId,
      type: paid ? 'TICKETS_CONFIRMED' : 'TICKETS_DECLINED',
      message: paid
        ? `Your ${event.totalAmount} ticket purchase (order ${event.orderId}) is confirmed.`
        : `Your ticket purchase (order ${event.orderId}) was declined: ${event.reason}`,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(record.id, record);
    await this.producer.send({
      topic: TOPICS.NOTIFICATION_CREATED,
      messages: [{ value: JSON.stringify({ notification: record } satisfies NotificationCreatedEvent) }],
    });
    this.logger.log(`notification created for ${event.userId}: ${record.type}`);
    void this.orkes.onNotificationCreated(event.orderId, record);
  }

  listByUser(userId: string): Notification[] {
    return [...this.notifications.values()]
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
