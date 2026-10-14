import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { createWorkflowApi } from '../api/axios';
import callApi from '../api/apiCaller';
import {
  ORKES_DEFAULT_BASE_URL,
  ORKES_ENDPOINT,
} from '../api/api-endpoints.constants';
import { TaskHandler } from './task-handler.interface';
import { TerminalTaskError } from './task-errors';
import { PolledTask, TaskResultPayload } from './worker.types';

/**
 * Owns the Conductor pull loop for every registered `TaskHandler`: one loop per
 * task type, shared backoff on transient errors, and graceful shutdown. It has
 * no business logic — handlers bring their own dependencies and `handle` a
 * single task. A handler that throws `TerminalTaskError` is reported FAILED;
 * any other error is left IN_PROGRESS so Conductor retries it.
 */
@Injectable()
export class TaskRunnerService implements OnModuleDestroy {
  private readonly logger = new Logger(TaskRunnerService.name);
  private readonly enabled: boolean;
  private readonly api: AxiosInstance;
  private readonly pollIntervalMs: number;
  private readonly maxBackoffMs: number;
  private readonly handlers = new Map<string, TaskHandler>();
  private stopped = false;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.enabled =
      (this.config.get<string>('ORKES_ENABLED') ?? 'true') === 'true';
    this.api = createWorkflowApi(
      this.config.get<string>('ORKES_URL') ?? ORKES_DEFAULT_BASE_URL,
    );
    this.pollIntervalMs = Number(
      this.config.get<string>('ORKES_WORKER_POLL_MS') ?? '1000',
    );
    this.maxBackoffMs = Number(
      this.config.get<string>('ORKES_WORKER_MAX_BACKOFF_MS') ?? '10000',
    );
  }

  register(handler: TaskHandler): void {
    if (!this.enabled) return;

    if (this.handlers.has(handler.taskType)) return;

    this.handlers.set(handler.taskType, handler);
    this.logger.log(
      `[orkes-worker] registered ${handler.taskType} (worker ${handler.workerId})`,
    );
    void this.run(handler);
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async run(handler: TaskHandler): Promise<void> {
    let backoff = this.pollIntervalMs;

    while (!this.stopped) {
      try {
        const task = await this.poll(handler.taskType, handler.workerId);

        if (task) {
          await this.dispatch(handler, task);
          backoff = this.pollIntervalMs;
        }

        await this.sleep(backoff);
      } catch (err) {
        this.logger.warn(
          `[orkes-worker] ${handler.taskType} loop error: ${(err as Error).message}`,
        );
        await this.sleep(backoff);
        backoff = Math.min(backoff * 2, this.maxBackoffMs);
      }
    }
  }

  private async poll(
    taskType: string,
    workerId: string,
  ): Promise<PolledTask | undefined> {
    const task = await callApi<
      PolledTask | undefined,
      { workerid: string },
      undefined
    >(this.api, `${ORKES_ENDPOINT.tasks}/poll/${taskType}`, 'get', undefined, {
      workerid: workerId,
    });

    if (task) {
      this.logger.log(
        `[orkes-worker] polled ${taskType} (task ${task.taskId}, run ${task.workflowInstanceId})`,
      );
    }

    return task;
  }

  private async dispatch(handler: TaskHandler, task: PolledTask): Promise<void> {
    try {
      const outputData = await handler.handle(task);
      await this.report(task, handler.taskType, 'COMPLETED', outputData);
    } catch (err) {
      if (err instanceof TerminalTaskError) {
        this.logger.warn(
          `[orkes-worker] ${handler.taskType} terminal failure: ${err.message}`,
        );
        await this.report(task, handler.taskType, 'FAILED', {
          reason: err.message,
        });
        return;
      }
      throw err;
    }
  }

  private async report(
    task: PolledTask,
    taskType: string,
    status: 'COMPLETED' | 'FAILED',
    outputData: Record<string, unknown>,
  ): Promise<void> {
    const payload: TaskResultPayload = {
      workflowInstanceId: task.workflowInstanceId,
      taskId: task.taskId,
      referenceTaskName: task.referenceTaskName,
      taskType,
      status,
      inputData: task.inputData ?? {},
      outputData,
    };

    await callApi<unknown, undefined, TaskResultPayload>(
      this.api,
      ORKES_ENDPOINT.tasks,
      'post',
      payload,
    );

    this.logger.log(
      `[orkes-worker] ${taskType} ${status} ${JSON.stringify(outputData)} (task ${task.taskId})`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
