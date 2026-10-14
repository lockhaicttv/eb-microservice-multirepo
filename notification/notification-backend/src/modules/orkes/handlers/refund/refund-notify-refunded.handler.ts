import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { v7 as uuidv7 } from 'uuid';
import { NotificationCreatedEvent, TOPICS } from '@demo/contracts';
import { KAFKA_PRODUCER } from '../../../../kafka/kafka-core.module';
import { NotificationEntity } from '../../../../database/entities/notification.entity';
import { Notification } from '../../../../database/models/notification.model';
import { NotificationRepository } from '../../../notification/notification.repository';
import { TaskRunnerService } from '../../worker/task-runner.service';
import { TerminalTaskError } from '../../worker/task-errors';
import { TaskHandler } from '../../worker/task-handler.interface';
import { PolledTask } from '../../worker/worker.types';
import { REFUND_TASK, REFUND_WORKER } from './refund.constants';

/**
 * `refund_notify_refunded` handler (notification-backend).
 *
 * Runs on the `refund_flow` `true` branch after `refund_mark_refunded`: records
 * a `REFUND_ISSUED` notification and emits `NOTIFICATION_CREATED` so the
 * notification BFF can push it over its GraphQL subscription. The refund_flow
 * is its own plane, so this does not touch the `order_flow` mirror.
 */
@Injectable()
export class RefundNotifyRefundedHandler implements TaskHandler, OnModuleInit {
  readonly taskType = REFUND_TASK.NOTIFY_REFUNDED;
  readonly workerId = REFUND_WORKER.NOTIFY_REFUNDED;
  private readonly logger = new Logger(RefundNotifyRefundedHandler.name);

  constructor(
    private readonly notifications: NotificationRepository,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
    private readonly runner: TaskRunnerService,
  ) {}

  onModuleInit() {
    this.runner.register(this);
  }

  async handle(task: PolledTask): Promise<Record<string, unknown>> {
    const { orderId, userId, totalAmount, refundId } = (task.inputData ??
      {}) as {
      orderId?: string;
      userId?: string;
      totalAmount?: number | string;
      refundId?: string;
    };

    if (!orderId || !userId) throw new TerminalTaskError('MISSING_INPUT');

    const entity = new NotificationEntity();
    entity.id = uuidv7();
    entity.userId = userId;
    entity.type = 'REFUND_ISSUED';
    entity.message = `Your refund of ${totalAmount} for order ${orderId} has been issued (refund ${refundId ?? 'n/a'}).`;
    const saved = await this.notifications.save(entity);

    const notification = Notification.fromEntity(saved);
    await this.producer.send({
      topic: TOPICS.NOTIFICATION_CREATED,
      messages: [
        { value: JSON.stringify({ notification } satisfies NotificationCreatedEvent) },
      ],
    });
    this.logger.log(`notification created for ${userId}: ${notification.type}`);

    return { notificationId: saved.id };
  }
}
