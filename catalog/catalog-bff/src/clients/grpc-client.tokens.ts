/**
 * Injection tokens for the per-upstream gRPC proxies.
 *
 * Kept in their own file so `catalog-gateway.service` can import them without
 * importing `grpc-clients.module`, which imports the gateway back. A cycle here
 * evaluates the tokens as `undefined` at decoration time and Nest then fails with
 * an unresolvable dependency.
 */
export const CATALOG_GRPC_CLIENT = 'CATALOG_GRPC_CLIENT';
export const AUTH_GRPC_CLIENT = 'AUTH_GRPC_CLIENT';

export const CATALOG_GRPC_URL = 'CATALOG_GRPC_URL';
export const AUTH_GRPC_URL = 'AUTH_GRPC_URL';
