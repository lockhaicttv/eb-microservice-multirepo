/**
 * Conductor (Orkes) REST resources. Never write a URL inline — reference these
 * constants and append the sub-path (e.g. `${ORKES_ENDPOINT.tasks}/poll/...`).
 */
export const ORKES_ENDPOINT = {
  workflow: 'workflow',
  metadataWorkflow: 'metadata/workflow',
  tasks: 'tasks',
} as const;

export const ORKES_DEFAULT_BASE_URL = 'http://localhost:8082/api';