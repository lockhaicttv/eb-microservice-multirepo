import axios, { AxiosInstance } from 'axios';

/**
 * Creates the Conductor (Orkes) API client. Mirrors the shared axios layer:
 * a single configured instance whose response interceptor unwraps `res.data`
 * so callers receive the body directly, and rejects with the original error
 * for everything else. The base URL is injected because it comes from
 * ConfigService (not available at module-import time).
 */
export const createWorkflowApi = (baseUrl: string): AxiosInstance => {
  const api = axios.create({ baseURL: baseUrl });

  api.interceptors.response.use(
    (res) =>
      new Promise((resolve) => {
        resolve(res.data);
      }),
    (err) => {
      if (err.response) {
        return new Promise((_, reject) => reject(err));
      }
      return new Promise((_, reject) => reject(err));
    },
  );

  return api;
};