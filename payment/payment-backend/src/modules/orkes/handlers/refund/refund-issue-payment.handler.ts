import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { RefundEntity } from '../../../../database/entities/refund.entity';
import { RefundRepository } from '../../../refund/refund.repository';
import { TaskRunnerService } from '../../worker/task-runner.service';
import { TerminalTaskError } from '../../worker/task-errors';
import { TaskHandler } from '../../worker/task-handler.interface';
import { PolledTask } from '../../worker/worker.types';
import { REFUND_TASK, REFUND_WORKER } from './refund.constants';

/**
 * `refund_issue_payment` handler (payment-backend).
 *
 * Runs on the `refund_flow` `true` branch and records the refund in the
 * `refunds` table. It reports `outputData.refundId` back to the workflow, which
 * `refund_notify_refunded` consumes. Idempotent because Conductor can
 * re-deliver a task: an existing refund for the same order is reused instead of
 * inserting a second row.
 */
@Injectable()
export class RefundIssuePaymentHandler implements TaskHandler, OnModuleInit {
  readonly taskType = REFUND_TASK.ISSUE_PAYMENT;
  readonly workerId = REFUND_WORKER.ISSUE_PAYMENT;
  private readonly logger = new Logger(RefundIssuePaymentHandler.name);

  constructor(
    private readonly refunds: RefundRepository,
    private readonly runner: TaskRunnerService,
  ) {}

  onModuleInit() {
    this.runner.register(this);
  }

  async handle(task: PolledTask): Promise<Record<string, unknown>> {
    const { orderId, userId, totalAmount } = (task.inputData ?? {}) as {
      orderId?: string;
      userId?: string;
      totalAmount?: number | string;
    };

    if (
      !orderId ||
      !userId ||
      totalAmount === undefined ||
      totalAmount === null
    )
      throw new TerminalTaskError('MISSING_INPUT');

    const existing = await this.refunds.findOne({ where: { orderId } });
    if (existing) return { refundId: existing.id };

    const entity = new RefundEntity();
    entity.id = uuidv7();
    entity.orderId = orderId;
    entity.userId = userId;
    entity.totalAmount = Number(totalAmount).toFixed(2);
    entity.status = 'ISSUED';
    entity.reason = null;

    const saved = await this.refunds.save(entity);

    this.logger.log(
      `issued refund ${saved.id} for order ${orderId} (${saved.totalAmount})`,
    );

    return { refundId: saved.id };
  }
}
