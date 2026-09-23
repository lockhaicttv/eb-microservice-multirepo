'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import StatusBadge from '@/components/StatusBadge'
import useGetNotifications from '@/containers/Profile/hooks/useGetNotifications'
import useNotificationCreatedSubscription from '@/containers/Profile/hooks/useNotificationCreatedSubscription'
import { useStore } from '@/store/useStore'
import { timeAgo } from '@/utils/formatters'

const NotificationsPage = () => {
  const router = useRouter()
  const accessToken = useStore((state) => state.accessToken)
  const { data: notifications, isFetching } = useGetNotifications()
  useNotificationCreatedSubscription()

  useEffect(() => {
    if (!accessToken) router.replace('/login')
  }, [accessToken, router])

  const sorted = useMemo(
    () => [...(notifications ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications]
  )

  return (
    <main className='flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col gap-6'>
      <div className='flex items-center gap-2'>
        <Icon name='notifications' className='text-[20px] text-primary' />
        <h1 className='text-headline-lg font-display font-bold text-on-surface'>Notifications</h1>
      </div>

      {isFetching ? (
        <div className='flex flex-col items-center gap-4 py-16 text-on-surface-variant'>
          <div className='w-12 h-12 rounded-full border-2 border-outline-variant border-t-primary animate-spin'></div>
          <span className='text-label-lg'>Loading notifications…</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-10 flex flex-col items-center gap-3 text-center'>
          <Icon name='notifications_none' className='text-[48px] text-outline' />
          <p className='text-headline-md font-display text-on-surface'>No notifications yet</p>
          <p className='text-body-sm text-on-surface-variant max-w-sm'>
            Live updates about your ticket orders will stream here in realtime.
          </p>
          <Link
            href='/'
            className='mt-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold'
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {sorted.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                notif.type === 'TICKETS_CONFIRMED'
                  ? 'bg-tertiary-container/10 border-tertiary-container/30'
                  : 'bg-error/10 border-error/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  notif.type === 'TICKETS_CONFIRMED'
                    ? 'bg-tertiary-container/20 text-tertiary'
                    : 'bg-error/20 text-error'
                }`}
              >
                <Icon
                  name={notif.type === 'TICKETS_CONFIRMED' ? 'confirmation_number' : 'link_off'}
                  className='text-[20px]'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <StatusBadge status={notif.type} type='notification' />
                  <span className='text-body-sm text-outline shrink-0'>{timeAgo(notif.createdAt)}</span>
                </div>
                <p className='text-body-md text-on-surface mt-1.5'>{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default NotificationsPage
