'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Icon from '@/components/Icon'
import RoleBadge from '@/components/RoleBadge'
import useGetUsers, { useSetUserRole } from '@/containers/Admin/hooks/useGetUsers'
import usePermissions from '@/hooks/usePermissions'
import { useStore } from '@/store/useStore'
import { USER_ROLES } from '@/types/user.types'
import type { UserModel } from '@/types/api.types'

const Avatar = ({ name }: { name: string }) => (
  <div className='w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center font-bold text-label-md text-on-surface-variant shrink-0'>
    {name.slice(0, 1).toUpperCase()}
  </div>
)

const UserRow = ({ user, isSelf, onToggle }: { user: UserModel; isSelf: boolean; onToggle: (u: UserModel) => void }) => {
  const isOwner = user.role === USER_ROLES.EVENT_OWNER
  const canToggle = user.role !== USER_ROLES.ADMIN && !isSelf

  return (
    <div className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/30'>
      <Avatar name={user.name} />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='text-label-lg font-semibold text-on-surface'>{user.name}</span>
          {isSelf && (
            <span className='text-label-sm text-outline border border-outline-variant/50 rounded-full px-2 py-0.5'>
              you
            </span>
          )}
        </div>
        <span className='text-body-sm text-outline truncate block'>{user.email}</span>
      </div>
      <RoleBadge role={user.role} />
      <div className='sm:w-44 shrink-0'>
        {canToggle ? (
          <button
            type='button'
            onClick={() => onToggle(user)}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-label-lg font-bold transition-colors bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
          >
            <Icon name={isOwner ? 'person_off' : 'verified_user'} className='text-[18px]' />
            {isOwner ? 'Revoke owner' : 'Make owner'}
          </button>
        ) : (
          // An admin row (and your own row) has no action: granting ADMIN is not
          // reachable from the UI, and you cannot change your own role.
          <p className='text-body-sm text-outline text-center sm:text-left'>
            {isSelf ? 'Cannot change own role' : 'Managed manually'}
          </p>
        )}
      </div>
    </div>
  )
}

const AdminList = () => {
  const router = useRouter()
  const { role, hydrated, isAuthenticated, canViewAdminDashboard } = usePermissions()
  const { data: users, isLoading, isError, error } = useGetUsers()
  const setUserRole = useSetUserRole()
  const currentUserId = useStore((state) => state.user?.id)

  // Route guard for the UI. Not a security boundary: auth-bff rejects the
  // `users` query for a non-admin token regardless of what this renders.
  //
  // Gated on `hydrated` — before the persisted store rehydrates the session
  // looks logged out, and redirecting then would bounce a real admin off a page
  // they are entitled to.
  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/login')
    else if (!canViewAdminDashboard) router.replace('/')
  }, [hydrated, isAuthenticated, canViewAdminDashboard, router])

  if (!hydrated || !isAuthenticated || !canViewAdminDashboard) return null

  const counts = (users ?? []).reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1
    return acc
  }, {})

  const onToggle = (user: UserModel) => {
    setUserRole.mutate({
      userId: user.id,
      role: user.role === USER_ROLES.EVENT_OWNER ? USER_ROLES.CUSTOMER : USER_ROLES.EVENT_OWNER
    })
  }

  return (
    <main className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
      <div className='flex items-start gap-3 mb-6'>
        <div className='w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0'>
          <Icon name='admin_panel_settings' className='text-[22px]' />
        </div>
        <div>
          <h1 className='text-headline-md font-display text-on-surface'>Admin</h1>
          <p className='text-body-sm text-outline'>
            Manage roles across the platform. Signed in as {role}.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4 mb-8'>
        {[
          { label: 'Total users', value: users?.length ?? 0, icon: 'group' },
          { label: 'Event owners', value: counts[USER_ROLES.EVENT_OWNER] ?? 0, icon: 'verified_user' },
          { label: 'Admins', value: counts[USER_ROLES.ADMIN] ?? 0, icon: 'shield' }
        ].map((stat) => (
          <div key={stat.label} className='p-4 rounded-xl bg-surface-container-low border border-outline-variant/30'>
            <div className='flex items-center gap-2 text-on-surface-variant'>
              <Icon name={stat.icon} className='text-[18px]' />
              <span className='text-label-md'>{stat.label}</span>
            </div>
            <p className='text-headline-md font-display text-on-surface mt-1'>{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className='text-headline-sm font-display text-on-surface mb-4'>Users</h2>

      {isLoading && (
        <div className='flex flex-col gap-3'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='h-[84px] rounded-xl bg-surface-container-low animate-pulse' />
          ))}
        </div>
      )}

      {isError && (
        <div className='flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30 text-error'>
          <Icon name='error' className='text-[20px] shrink-0' />
          <p className='text-body-sm'>{error instanceof Error ? error.message : 'Failed to load users.'}</p>
        </div>
      )}

      {users && users.length === 0 && (
        <div className='py-10 text-center text-on-surface-variant'>
          <p className='text-body-md'>No users yet.</p>
        </div>
      )}

      <div className='flex flex-col gap-3'>
        {users?.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} onToggle={onToggle} />
        ))}
      </div>

      {setUserRole.isError && (
        <div className='mt-4 flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30 text-error'>
          <Icon name='error' className='text-[20px] shrink-0' />
          <p className='text-body-sm'>
            {setUserRole.error instanceof Error ? setUserRole.error.message : 'Could not update role.'}
          </p>
        </div>
      )}
    </main>
  )
}

export default AdminList