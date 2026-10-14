/**
 * Shape of a task returned by `GET /tasks/poll/{taskType}`. `inputData` is what
 * the workflow fed the task; a worker echoes it back when reporting.
 */
export interface PolledTask {
  taskId: string;
  workflowInstanceId: string;
  referenceTaskName: string;
  taskType?: string;
  inputData?: Record<string, unknown>;
}

/** Task result posted back to `POST /tasks`. */
export interface TaskResultPayload {
  workflowInstanceId: string;
  taskId: string;
  referenceTaskName: string;
  taskType: string;
  status: 'COMPLETED' | 'FAILED';
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
}
