/** `refund_flow` task types (shared vocabulary across the backends). */
export const REFUND_TASK = {
  CHECK_ELIGIBILITY: 'refund_check_eligibility',
  ISSUE_PAYMENT: 'refund_issue_payment',
  MARK_REFUNDED: 'refund_mark_refunded',
  MARK_REJECTED: 'refund_mark_rejected',
  NOTIFY_REFUNDED: 'refund_notify_refunded',
  NOTIFY_REJECTED: 'refund_notify_rejected',
} as const;

/** Worker ids owned by this backend (unique per poller). */
export const REFUND_WORKER = {
  ISSUE_PAYMENT: 'payment-backend-refund-issue-payment-worker',
} as const;
