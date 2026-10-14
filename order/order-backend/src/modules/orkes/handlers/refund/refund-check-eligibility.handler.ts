import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CATALOG_SERVICE_NAME, CatalogServiceClient } from '@demo/contracts';
import { OrderEntity } from '../../../../database/entities/order.entity';
import { OrderRepository } from '../../../order/order.repository';
import { TaskRunnerService } from '../../worker/task-runner.service';
import { TaskHandler } from '../../worker/task-handler.interface';
import { PolledTask } from '../../worker/worker.types';
import { REFUND_TASK, REFUND_WORKER } from './refund.constants';

/**
 * `refund_check_eligibility` handler (order-backend).
 *
 * Pure gate for the `refund_flow` SWITCH: it decides `eligible` and never
 * touches money. A refund is only allowed on a `PAID` order whose events have
 * not started yet; the start time is catalog-owned, so it is fetched over gRPC.
 */
@Injectable()
export class RefundCheckEligibilityHandler implements TaskHandler, OnModuleInit {
  readonly taskType = REFUND_TASK.CHECK_ELIGIBILITY;
  readonly workerId = REFUND_WORKER.CHECK_ELIGIBILITY;
  private catalog!: CatalogServiceClient;

  constructor(
    private readonly orders: OrderRepository,
    @Inject(CATALOG_SERVICE_NAME) private readonly clients: ClientGrpc,
    private readonly runner: TaskRunnerService,
  ) {}

  onModuleInit() {
    this.catalog =
      this.clients.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
    this.runner.register(this);
  }

  async handle(task: PolledTask): Promise<Record<string, unknown>> {
    const orderId = task.inputData?.orderId as string | undefined;

    if (!orderId) return { eligible: false, reason: 'MISSING_ORDER_ID' };

    const order = await this.orders.findOne({ where: { id: orderId } });

    if (!order) return { eligible: false, reason: 'ORDER_NOT_FOUND' };

    if (order.status !== 'PAID')
      return { eligible: false, reason: `NOT_PAID:${order.status}` };

    const started = await this.findStartedEvent(order);

    if (started)
      return { eligible: false, reason: `EVENT_ALREADY_STARTED:${started}` };

    return { eligible: true, reason: '' };
  }

  /**
   * Returns the id of the first line item's event that has already started, or
   * `undefined` if every event on the order is still upcoming. An unknown start
   * (`startsAt` empty) or a missing product is treated as "not started" — only
   * positive evidence that an event began refuses a refund.
   */
  private async findStartedEvent(
    order: OrderEntity,
  ): Promise<string | undefined> {
    const productIds = [
      ...new Set((order.lineItems ?? []).map((line) => line.productId)),
    ];
    const now = Date.now();

    for (const productId of productIds) {
      const res = await firstValueFrom(this.catalog.getProduct({ productId }));
      const startsAt = res.product?.startsAt;
      if (!startsAt) continue;

      const startedAt = Date.parse(startsAt);
      if (Number.isFinite(startedAt) && startedAt <= now) return productId;
    }

    return undefined;
  }
}
