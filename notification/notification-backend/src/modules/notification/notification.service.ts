import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { NotificationCreatedEvent, PaymentDecisionEvent, TOPICS } from '@demo/contracts';
import { KAFKA, KAFKA_PRODUCER } from '../../kafka/kafka-core.module';
import { createConsumer } from '../../kafka/kafka.utils';
import { v7 as uuidv7 } from 'uuid';
import { OrkesService } from '../orkes/orkes.service';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { Notification } from '../../database/models/notification.model';

export const NOTIFICATION_EVENT_GROUP = 'notification-events';

import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notifications: NotificationRepository,
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

    const entity = new NotificationEntity();
    entity.id = uuidv7();
    entity.userId = event.userId;
    entity.type = paid ? 'TICKETS_CONFIRMED' : 'TICKETS_DECLINED';
    entity.message = paid
      ? `Your ${event.totalAmount} ticket purchase (order ${event.orderId}) is confirmed.`
      : `Your ticket purchase (order ${event.orderId}) was declined: ${event.reason}`;
    const saved = await this.notifications.save(entity);

    const notification = Notification.fromEntity(saved);
    await this.producer.send({
      topic: TOPICS.NOTIFICATION_CREATED,
      messages: [{ value: JSON.stringify({ notification } satisfies NotificationCreatedEvent) }],
    });
    this.logger.log(`notification created for ${event.userId}: ${notification.type}`);
    void this.orkes.onNotificationCreated(event.orderId, notification);
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => Notification.fromEntity(row));
  }
}
