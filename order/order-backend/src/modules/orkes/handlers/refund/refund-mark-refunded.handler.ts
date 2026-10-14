import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderRepository } from '../../../order/order.repository';
import { TaskRunnerService } from '../../worker/task-runner.service';
import { TerminalTaskError } from '../../worker/task-errors';
import { TaskHandler } from '../../worker/task-handler.interface';
import { PolledTask } from '../../worker/worker.types';
import { REFUND_TASK, REFUND_WORKER } from './refund.constants';

/**
 * `refund_mark_refunded` handler (order-backend).
 *
 * Runs after `refund_issue_payment` succeeds: flips the order to `REFUNDED`.
 * Idempotent (Conductor can re-deliver the task). The refund outcome is carried
 * by the `refund_flow` itself (`refund_notify_refunded`), so this handler emits
 * nothing on Kafka or the `order_flow` mirror.
 */
@Injectable()
export class RefundMarkRefundedHandler implements TaskHandler, OnModuleInit {
  readonly taskType = REFUND_TASK.MARK_REFUNDED;
  readonly workerId = REFUND_WORKER.MARK_REFUNDED;
  private readonly logger = new Logger(RefundMarkRefundedHandler.name);

  constructor(
    private readonly orders: OrderRepository,
    private readonly runner: TaskRunnerService,
  ) {}

  onModuleInit() {
    this.runner.register(this);
  }

  async handle(task: PolledTask): Promise<Record<string, unknown>> {
    const orderId = task.inputData?.orderId as string | undefined;

    if (!orderId) throw new TerminalTaskError('MISSING_ORDER_ID');

    const order = await this.orders.findOne({ where: { id: orderId } });

    if (!order) throw new TerminalTaskError('ORDER_NOT_FOUND');

    if (order.status === 'REFUNDED') return { orderId, status: order.status };

    const previousStatus = order.status;
    order.status = 'REFUNDED';
    const saved = await this.orders.save(order);

    this.logger.log(`order ${saved.id} ${previousStatus} -> ${saved.status}`);

    return { orderId: saved.id, status: saved.status };
  }
}
