import Icon from '@/components/Icon'
import { USER_ROLES } from '@/types/user.types'
import type { UserRole } from '@/types/api.types'

interface RoleConfig {
  label: string
  className: string
  icon: string
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  [USER_ROLES.ADMIN]: {
    label: 'Admin',
    className: 'bg-primary/15 border-primary/40 text-primary',
    icon: 'shield'
  },
  [USER_ROLES.EVENT_OWNER]: {
    label: 'Event Owner',
    className: 'bg-tertiary-container/15 border-tertiary-container/40 text-tertiary',
    icon: 'verified_user'
  },
  [USER_ROLES.CUSTOMER]: {
    label: 'Customer',
    className: 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant',
    icon: 'person'
  }
}

/**
 * Renders a user's role. Kept separate from StatusBadge because that component
 * is keyed on order/payment status, where the label set is business state rather
 * than an access level.
 */
const RoleBadge = ({ role, className = '' }: { role: UserRole; className?: string }) => {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG[USER_ROLES.CUSTOMER]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-label-sm font-semibold ${config.className} ${className}`}
    >
      <Icon name={config.icon} className='text-[16px]' />
      {config.label}
    </span>
  )
}

export default RoleBadge