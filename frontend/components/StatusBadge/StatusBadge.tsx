import Icon from '@/components/Icon'
import type { OrderStatus, NotificationType } from '@/types/api.types'

interface StatusConfig {
  label: string
  className: string
  icon: string
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-secondary/15 border-secondary/40 text-secondary',
    icon: 'hourglass_top'
  },
  PAID: {
    label: 'Confirmed',
    className: 'bg-tertiary-container/15 border-tertiary-container/40 text-tertiary',
    icon: 'check_circle'
  },
  DECLINED: {
    label: 'Declined',
    className: 'bg-error/15 border-error/40 text-error',
    icon: 'cancel'
  }
}

const NOTIFICATION_TYPE_CONFIG: Record<string, StatusConfig> = {
  TICKETS_CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-tertiary-container/15 border-tertiary-container/40 text-tertiary',
    icon: 'confirmation_number'
  },
  TICKETS_DECLINED: {
    label: 'Declined',
    className: 'bg-error/15 border-error/40 text-error',
    icon: 'link_off'
  }
}

const StatusBadge = ({
  status,
  type = 'order'
}: {
  status: OrderStatus | NotificationType | string
  type?: 'order' | 'notification'
}) => {
  const fallback: StatusConfig = {
    label: status,
    className: 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant',
    icon: 'schedule'
  }
  const config =
    (type === 'order'
      ? ORDER_STATUS_CONFIG[status as OrderStatus]
      : (NOTIFICATION_TYPE_CONFIG[status] ??
        NOTIFICATION_TYPE_CONFIG[status as keyof typeof NOTIFICATION_TYPE_CONFIG])) ?? fallback

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-label-sm font-semibold ${config.className}`}
    >
      <Icon name={config.icon} className='text-[16px]' />
      {config.label}
    </span>
  )
}

export default StatusBadge
