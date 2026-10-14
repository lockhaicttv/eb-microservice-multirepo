/**
 * Thrown by a handler when a task cannot succeed and must not be retried.
 * `TaskRunnerService` reports such a task as FAILED; any other error is treated
 * as transient and left IN_PROGRESS so Conductor re-delivers it.
 */
export class TerminalTaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TerminalTaskError';
  }
}
