import { PolledTask } from './worker.types';

/**
 * Business logic for a single Conductor `SIMPLE` task type. Handlers are
 * registered with `TaskRunnerService`, which owns polling and reporting; a
 * handler only maps a polled task to its `outputData` (or throws
 * `TerminalTaskError` to fail the task without a retry).
 */
export interface TaskHandler {
  readonly taskType: string;
  readonly workerId: string;
  handle(task: PolledTask): Promise<Record<string, unknown>>;
}
