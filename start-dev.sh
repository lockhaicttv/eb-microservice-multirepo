#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT}/.logs"
mkdir -p "${LOG_DIR}"

BACKENDS=(
  auth/auth-backend
  catalog/catalog-backend
  order/order-backend
  payment/payment-backend
  notification/notification-backend
)

BFFS=(
  auth/auth-bff
  catalog/catalog-bff
  order/order-bff
  payment/payment-bff
  notification/notification-bff
)

PIDS=()

launch() {
  local service="$1"
  local log="${LOG_DIR}/$(basename "${service}").dev.log"
  echo "Starting ${service} -> ${log}"
  (cd "${ROOT}/${service}" && exec pnpm start:dev) >"${log}" 2>&1 &
  PIDS+=($!)
}

cleanup() {
  echo
  echo "Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "=== Starting backends (pnpm start:dev) ==="
for svc in "${BACKENDS[@]}"; do launch "${svc}"; done

echo "=== Starting BFFs (pnpm start:dev) ==="
for svc in "${BFFS[@]}"; do launch "${svc}"; done

echo "All services started. Press Ctrl-C to stop them all. Logs in ${LOG_DIR}/"
wait