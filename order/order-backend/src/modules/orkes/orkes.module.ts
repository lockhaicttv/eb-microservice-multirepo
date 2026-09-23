import { Inject, Injectable, Logger, OnModuleInit, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Order,
  OrderStatusUpdatedEvent,
  PaymentDecisionEvent,
  Notification,
} from '@demo/contracts';

const WORKFLOW_NAME = 'order_flow';

const WORKFLOW_DEF = {
  name: WORKFLOW_NAME,
  description: 'Order lifecycle mirrored from Kafka events (visualization only)',
  version: 1,
  schemaVersion: 2,
  ownerEmail: 'demo@demo.dev',
  tasks: [
    { name: 'order_created', taskReferenceName: 'order_created', type: 'SIMPLE' },
    { name: 'payment', taskReferenceName: 'payment', type: 'SIMPLE' },
    {
      name: 'fanout',
      taskReferenceName: 'fanout',
      type: 'FORK_JOIN',
      forkTasks: [
        [{ name: 'order_updated', taskReferenceName: 'order_updated', type: 'SIMPLE' }],
        [{ name: 'notification', taskReferenceName: 'notification', type: 'SIMPLE' }],
      ],
    },
    { name: 'join', taskReferenceName: 'join', type: 'JOIN', joinOn: ['order_updated', 'notification'] },
  ],
};

// Orkes/Conductor is NOT the orchestrator. It is a visualization plane:
// every backend that sends/consumes a Kafka event mirrors that moment into an
// "order_flow" workflow. In the per-service decomposition each backend is a
// separate process, so the run id is resolved by searching Conductor for the
// correlationId (order id) rather than assuming a shared in-memory map.
// All calls are fire-and-forget so the system works even if Conductor is down.
@Injectable()
export class OrkesService implements OnModuleInit {
  private readonly logger = new Logger(OrkesService.name);
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly runs = new Map<string, string>(); // orderId -> workflow (run) id
  private warned = false;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.enabled = (this.config.get<string>('ORKES_ENABLED') ?? 'true') === 'true';
    this.baseUrl = this.config.get<string>('ORKES_URL') ?? 'http://localhost:8082/api';
  }

  async onModuleInit() {
    if (!this.enabled) return;
    await this.retry(() => this.registerWorkflowDef(), `register ${WORKFLOW_NAME}`);
  }

  // send point: demo.order.created (only the order backend starts the run)
  async onOrderCreated(order: Order) {
    if (!this.enabled) return;
    const runId = await this.safe('start workflow', () =>
      this.post(`${this.baseUrl}/workflow`, {
        name: WORKFLOW_NAME,
        correlationId: order.id,
        input: { orderId: order.id, userId: order.userId, totalAmount: order.totalAmount },
      }),
    );
    if (runId) this.runs.set(order.id, runId);
    await this.completeStage(order.id, 'order_created', {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
    });
  }

  // send point: demo.payment.confirmed / demo.payment.declined
  async onPaymentDecision(event: PaymentDecisionEvent) {
    if (!this.enabled) return;
    await this.completeStage(event.orderId, 'payment', {
      orderId: event.orderId,
      status: event.status,
      totalAmount: event.totalAmount,
      reason: event.reason,
    });
  }

  // send point: demo.order.status.updated
  async onOrderUpdated(event: OrderStatusUpdatedEvent) {
    if (!this.enabled) return;
    await this.completeStage(event.orderId, 'order_updated', {
      orderId: event.orderId,
      status: event.status,
      previousStatus: event.previousStatus,
      totalAmount: event.totalAmount,
    });
  }

  // send point: demo.notification.created (orderId comes from the payment event
  // that triggered the notification in the notification backend)
  async onNotificationCreated(orderId: string, notification: Notification) {
    if (!this.enabled) return;
    await this.completeStage(orderId, 'notification', {
      notificationId: notification.id,
      type: notification.type,
      userId: notification.userId,
      orderId,
    });
  }

  private async completeStage(orderId: string, ref: string, output: Record<string, unknown>) {
    for (let attempt = 0; attempt < 15; attempt++) {
      const runId = this.runs.get(orderId) ?? (await this.resolveRunId(orderId));
      if (!runId) {
        await this.sleep(500);
        continue;
      }
      this.runs.set(orderId, runId);
      await this.safe(`complete ${ref}`, () => this.completeByRef(runId, ref, output));
      return;
    }
    this.logger.warn(`[orkes] no workflow run found for order ${orderId} (${ref} not recorded)`);
  }

  // The workflow was started in the order backend process; every other backend
  // finds the run by querying Conductor for workflows whose correlationId is
  // the order id (the same value set when the run was started).
  private async resolveRunId(orderId: string): Promise<string | undefined> {
    try {
      const res = await fetch(
        `${this.baseUrl}/workflow/search?freeText=${encodeURIComponent(orderId)}&size=10`,
      );
      if (!res.ok) return undefined;
      const body = (await res.json()) as { results?: Array<{ workflowId: string }> };
      const wf = body.results?.[0];
      return wf?.workflowId;
    } catch {
      return undefined;
    }
  }

  private async completeByRef(runId: string, ref: string, output: Record<string, unknown>) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const wf = (await this.getJson(`${this.baseUrl}/workflow/${runId}`)) as {
        tasks?: Array<{ taskId: string; referenceTaskName: string; taskType?: string; status?: string }>;
      };
      const task = wf.tasks?.find((t) => t.referenceTaskName === ref);
      if (!task) {
        await this.sleep(500); // fork children appear after the decider processes a completed task
        continue;
      }
      if (task.status === 'COMPLETED') return;
      await this.post(`${this.baseUrl}/tasks`, {
        workflowInstanceId: runId,
        taskId: task.taskId,
        referenceTaskName: ref,
        taskType: 'SIMPLE',
        status: 'COMPLETED',
        inputData: {},
        outputData: output,
      });
      return;
    }
    this.logger.warn(`[orkes] task ${ref} not found in run ${runId}`);
  }

  private async registerWorkflowDef() {
    await this.put(`${this.baseUrl}/metadata/workflow`, [WORKFLOW_DEF]);
    this.logger.log(`[orkes] registered ${WORKFLOW_NAME} -> ${this.baseUrl}`);
  }

  private async getJson(url: string): Promise<unknown> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.json();
  }

  private async post(url: string, body: unknown): Promise<string> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
    return res.text();
  }

  private async put(url: string, body: unknown): Promise<void> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${url} -> ${res.status}`);
  }

  private async safe(label: string, fn: () => Promise<unknown>): Promise<string> {
    try {
      return String((await fn()) ?? '');
    } catch (err) {
      if (!this.warned) {
        this.warned = true;
        this.logger.warn(`[orkes] ${label} failed: ${(err as Error).message} (suppressing further errors)`);
      }
      return '';
    }
  }

  private async retry(fn: () => Promise<void>, label: string) {
    for (let attempt = 1; attempt <= 15; attempt++) {
      try {
        await fn();
        return;
      } catch (err) {
        if (attempt === 15) {
          this.logger.warn(`[orkes] ${label} failed after retries: ${(err as Error).message}`);
        } else {
          this.logger.log(`[orkes] ${label} not ready (attempt ${attempt}), retrying...`);
          await this.sleep(2000);
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OrkesService],
  exports: [OrkesService],
})
export class OrkesModule {}