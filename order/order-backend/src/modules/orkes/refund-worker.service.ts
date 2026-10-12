import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStore } from '../order/order.store';

const TASK_TYPE = 'refund_check_eligibility';

interface PolledTask {
  taskId: string;
  workflowInstanceId: string;
  referenceTaskName: string;
  inputData?: { orderId?: string };
}

@Injectable()
export class RefundWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefundWorkerService.name);
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly workerId: string;
  private stopped = false;

  constructor(
    private readonly orders: OrderStore,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.enabled = (this.config.get<string>('ORKES_ENABLED') ?? 'true') === 'true';
    this.baseUrl = this.config.get<string>('ORKES_URL') ?? 'http://localhost:8082/api';
    this.pollIntervalMs = Number(this.config.get<string>('ORKES_REFUND_POLL_MS') ?? '1000');
    this.workerId = this.config.get<string>('ORKES_WORKER_ID') ?? 'order-backend-refund-worker';
  }

  onModuleInit() {
    if (!this.enabled) return;
    void this.pollLoop();
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async pollLoop() {
    while (!this.stopped) {
      try {
        const task = await this.poll();
        if (task) {
          const { eligible, reason } = await this.evaluate(task);
          await this.report(task, eligible, reason);
        }
      } catch (err) {
        this.logger.warn(`[orkes-worker] poll/process failed: ${(err as Error).message}`);
      }
      await this.sleep(this.pollIntervalMs);
    }
  }

  private async poll(): Promise<PolledTask | undefined> {
    const res = await fetch(
      `${this.baseUrl}/tasks/poll/${TASK_TYPE}?workerid=${encodeURIComponent(this.workerId)}`,
    );
    if (res.status === 204) return undefined;
    if (!res.ok) throw new Error(`GET /tasks/poll/${TASK_TYPE} -> ${res.status}`);
    const task = (await res.json()) as PolledTask;
    this.logger.log(
      `[orkes-worker] polled ${TASK_TYPE} (task ${task.taskId}, run ${task.workflowInstanceId}) -> evaluating`,
    );
    return task;
  }

  private async evaluate(task: PolledTask): Promise<{ eligible: boolean; reason: string }> {
    const orderId = task.inputData?.orderId;
    if (!orderId) return { eligible: false, reason: 'MISSING_ORDER_ID' };
    const order = await this.orders.get(orderId);
    if (!order) return { eligible: false, reason: 'ORDER_NOT_FOUND' };
    if (order.status !== 'PAID') return { eligible: false, reason: `NOT_PAID:${order.status}` };
    this.logger.log(`[orkes-worker] order ${order.id} is eligible for refund`);
    return { eligible: true, reason: '' };
  }

  private async report(task: PolledTask, eligible: boolean, reason: string) {
    const outputData: Record<string, unknown> = { eligible };
    if (reason) outputData.reason = reason;
    const res = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowInstanceId: task.workflowInstanceId,
        taskId: task.taskId,
        referenceTaskName: task.referenceTaskName,
        taskType: TASK_TYPE,
        status: 'COMPLETED',
        inputData: task.inputData ?? {},
        outputData,
      }),
    });
    if (!res.ok) throw new Error(`POST /tasks -> ${res.status}`);
    this.logger.log(
      `[orkes-worker] ${TASK_TYPE} ${eligible ? 'COMPLETED(eligible)' : `COMPLETED(not eligible: ${reason})`} (task ${task.taskId})`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}