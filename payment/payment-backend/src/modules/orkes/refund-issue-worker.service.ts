import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosInstance } from "axios";
import { v7 as uuidv7 } from "uuid";
import { RefundEntity } from "../../database/entities/refund.entity";
import { RefundRepository } from "../refund/refund.repository";
import { createWorkflowApi } from "./api/axios";
import callApi from "./api/apiCaller";
import {
  ORKES_DEFAULT_BASE_URL,
  ORKES_ENDPOINT,
} from "./api/api-endpoints.constants";

const TASK_TYPE = "refund_issue_payment";

interface PolledTask {
  taskId: string;
  workflowInstanceId: string;
  referenceTaskName: string;
  inputData?: {
    orderId?: string;
    userId?: string;
    totalAmount?: number | string;
  };
}

interface TaskUpdatePayload {
  workflowInstanceId: string;
  taskId: string;
  referenceTaskName: string;
  taskType: string;
  status: string;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
}

/**
 * `refund_issue_payment` worker (payment-backend).
 *
 * Pulls the `issue_payment` task the `refund_flow` `true` branch polls and
 * records the refund in the `refunds` table. It reports `outputData.refundId`
 * back to the workflow, which `refund_notify_refunded` consumes. The write is
 * idempotent because Conductor can re-deliver a task: an existing refund for the
 * same order is reused instead of inserting a second row.
 */
@Injectable()
export class RefundIssueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefundIssueWorkerService.name);
  private readonly enabled: boolean;
  private readonly api: AxiosInstance;
  private readonly pollIntervalMs: number;
  private readonly workerId: string;
  private stopped = false;

  constructor(
    private readonly refunds: RefundRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.enabled =
      (this.config.get<string>("ORKES_ENABLED") ?? "true") === "true";
    this.api = createWorkflowApi(
      this.config.get<string>("ORKES_URL") ?? ORKES_DEFAULT_BASE_URL,
    );
    this.pollIntervalMs = Number(
      this.config.get<string>("ORKES_REFUND_POLL_MS") ?? "1000",
    );
    this.workerId =
      this.config.get<string>("ORKES_WORKER_ID") ??
      "payment-backend-refund-worker";
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
          try {
            const outputData = await this.evaluate(task);

            await this.report(task, "COMPLETED", outputData);
          } catch (err) {
            const reason = (err as Error).message;

            this.logger.warn(`[orkes-worker] ${TASK_TYPE} failed: ${reason}`);
            await this.report(task, "FAILED", { refundId: "", reason });
          }
        }
      } catch (err) {
        this.logger.warn(
          `[orkes-worker] poll/process failed: ${(err as Error).message}`,
        );
      }

      await this.sleep(this.pollIntervalMs);
    }
  }

  private async poll(): Promise<PolledTask | undefined> {
    const task = await callApi<
      PolledTask | undefined,
      { workerid: string },
      undefined
    >(this.api, `${ORKES_ENDPOINT.tasks}/poll/${TASK_TYPE}`, "get", undefined, {
      workerid: this.workerId,
    });

    if (!task) return undefined;

    this.logger.log(
      `[orkes-worker] polled ${TASK_TYPE} (task ${task.taskId}, run ${task.workflowInstanceId}) -> issuing refund`,
    );

    return task;
  }

  private async evaluate(task: PolledTask): Promise<{ refundId: string }> {
    const { orderId, userId, totalAmount } = task.inputData ?? {};

    if (
      !orderId ||
      !userId ||
      totalAmount === undefined ||
      totalAmount === null
    )
      throw new Error("MISSING_INPUT");

    const existing = await this.refunds.findOne({ where: { orderId } });
    if (existing) return { refundId: existing.id };

    const entity = new RefundEntity();
    entity.id = uuidv7();
    entity.orderId = orderId;
    entity.userId = userId;
    entity.totalAmount = Number(totalAmount).toFixed(2);
    entity.status = "ISSUED";
    entity.reason = null;

    const saved = await this.refunds.save(entity);

    this.logger.log(
      `[orkes-worker] issued refund ${saved.id} for order ${orderId} (${saved.totalAmount})`,
    );

    return { refundId: saved.id };
  }

  private async report(
    task: PolledTask,
    status: "COMPLETED" | "FAILED",
    outputData: Record<string, unknown>,
  ) {
    const payload: TaskUpdatePayload = {
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      referenceTaskName: task.referenceTaskName,
      taskType: TASK_TYPE,
      status,
      inputData: task.inputData ?? {},
      outputData,
    };

    await callApi<unknown, undefined, TaskUpdatePayload>(
      this.api,
      ORKES_ENDPOINT.tasks,
      "post",
      payload,
    );

    this.logger.log(
      `[orkes-worker] ${TASK_TYPE} ${status} ${JSON.stringify(outputData)} (task ${task.taskId})`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
