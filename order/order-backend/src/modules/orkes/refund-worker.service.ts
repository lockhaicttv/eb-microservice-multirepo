import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientGrpc } from "@nestjs/microservices";
import { AxiosInstance } from "axios";
import { firstValueFrom } from "rxjs";
import { CATALOG_SERVICE_NAME, CatalogServiceClient } from "@demo/contracts";
import { OrderEntity } from "../../database/entities/order.entity";
import { OrderRepository } from "../order/order.repository";
import { createWorkflowApi } from "./api/axios";
import callApi from "./api/apiCaller";
import {
  ORKES_DEFAULT_BASE_URL,
  ORKES_ENDPOINT,
} from "./api/api-endpoints.constants";

const TASK_TYPE = "refund_check_eligibility";

interface PolledTask {
  taskId: string;
  workflowInstanceId: string;
  referenceTaskName: string;
  inputData?: { orderId?: string };
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

@Injectable()
export class RefundWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefundWorkerService.name);
  private readonly enabled: boolean;
  private readonly api: AxiosInstance;
  private readonly pollIntervalMs: number;
  private readonly workerId: string;
  private stopped = false;
  private catalog!: CatalogServiceClient;

  constructor(
    private readonly orders: OrderRepository,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(CATALOG_SERVICE_NAME) private readonly clients: ClientGrpc,
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
      "order-backend-refund-worker";
  }

  onModuleInit() {
    if (!this.enabled) return;

    this.catalog =
      this.clients.getService<CatalogServiceClient>(CATALOG_SERVICE_NAME);
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
      `[orkes-worker] polled ${TASK_TYPE} (task ${task.taskId}, run ${task.workflowInstanceId}) -> evaluating`,
    );

    return task;
  }

  private async evaluate(
    task: PolledTask,
  ): Promise<{ eligible: boolean; reason: string }> {
    const orderId = task.inputData?.orderId;

    if (!orderId) return { eligible: false, reason: "MISSING_ORDER_ID" };

    const order = await this.orders.findOne({ where: { id: orderId } });

    if (!order) return { eligible: false, reason: "ORDER_NOT_FOUND" };

    if (order.status !== "PAID")
      return { eligible: false, reason: `NOT_PAID:${order.status}` };

    const started = await this.findStartedEvent(order);
    if (started)
      return { eligible: false, reason: `EVENT_ALREADY_STARTED:${started}` };

    this.logger.log(`[orkes-worker] order ${order.id} is eligible for refund`);

    return { eligible: true, reason: "" };
  }

  /**
   * Returns the id of the first line item's event that has already started, or
   * `undefined` if every event on the order is still upcoming. A refund is only
   * allowed while nothing on the order has begun.
   *
   * The start time is not stored on the order (it is catalog-owned), so this
   * asks catalog-backend over gRPC. An unknown start (`startsAt` empty) or a
   * product we cannot find is treated as "not started" — we only refuse a refund
   * on positive evidence that the event has begun.
   */
  private async findStartedEvent(order: OrderEntity): Promise<string | undefined> {
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

  private async report(task: PolledTask, eligible: boolean, reason: string) {
    const outputData: Record<string, unknown> = { eligible };

    if (reason) outputData.reason = reason;

    const payload: TaskUpdatePayload = {
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      referenceTaskName: task.referenceTaskName,
      taskType: TASK_TYPE,
      status: "COMPLETED",
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
      `[orkes-worker] ${TASK_TYPE} ${eligible ? "COMPLETED(eligible)" : `COMPLETED(not eligible: ${reason})`} (task ${task.taskId})`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
