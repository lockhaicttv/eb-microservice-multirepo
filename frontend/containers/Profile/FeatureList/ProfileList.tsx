'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import StatusBadge from '@/components/StatusBadge'
import useGetMe, { useLogout } from '@/containers/Auth/hooks/useGetMe'
import useGetOrders from '@/containers/Profile/hooks/useGetOrders'
import useGetNotifications from '@/containers/Profile/hooks/useGetNotifications'
import useNotificationCreatedSubscription from '@/containers/Profile/hooks/useNotificationCreatedSubscription'
import useOrderUpdatedSubscription from '@/containers/Checkout/hooks/useOrderUpdatedSubscription'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate, timeAgo } from '@/utils/formatters'
import { getEventVisual } from '@/constants/event-visuals.constants'

const ProfileList = () => {
  const router = useRouter()
  const logout = useLogout()
  const user = useStore((state) => state.user)
  const accessToken = useStore((state) => state.accessToken)
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders' | 'notifications'>('tickets')

  const { data: meData } = useGetMe()
  const { data: orders, isFetching: isFetchingOrders } = useGetOrders()
  const { data: notifications } = useGetNotifications()

  useNotificationCreatedSubscription()
  useOrderUpdatedSubscription(() => {})

  useEffect(() => {
    if (!accessToken) router.replace('/login')
  }, [accessToken, router])

  const profile = meData ?? user

  const paidOrders = useMemo(() => orders?.filter((o) => o.status === 'PAID') ?? [], [orders])
  const sortedNotifications = useMemo(
    () => [...(notifications ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications]
  )

  const initials = profile
    ? profile.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '—'

  return (
    <main className='flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8'>
      <section className='relative rounded-2xl overflow-hidden border border-outline-variant/30 hero-glow bg-surface-container-low p-6 md:p-8'>
        <div className='absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-secondary'></div>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 relative'>
          <div className='w-20 h-20 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-display text-headline-lg font-bold ring-2 ring-primary/40 shrink-0'>
            {initials}
          </div>
          <div className='flex-1'>
            <span className='text-label-sm text-primary uppercase tracking-widest'>Member Wallet</span>
            <h1 className='text-headline-lg font-display font-bold text-on-surface mt-1'>{profile?.name ?? 'Guest'}</h1>
            <p className='text-body-md text-on-surface-variant'>{profile?.email}</p>
          </div>
          <div className='flex gap-3'>
            <div className='px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col items-center justify-center min-w-[90px]'>
              <span className='text-headline-sm font-display text-tertiary'>{paidOrders.length}</span>
              <span className='text-label-sm text-on-surface-variant'>Tickets</span>
            </div>
            <div className='px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col items-center justify-center min-w-[90px]'>
              <span className='text-headline-sm font-display text-secondary'>{orders?.length ?? 0}</span>
              <span className='text-label-sm text-on-surface-variant'>Orders</span>
            </div>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-outline-variant/30 flex items-center gap-2 overflow-x-auto flex-wrap'>
          {(
            [
              { key: 'tickets', label: `Upcoming Tickets (${paidOrders.length})`, icon: 'confirmation_number' },
              { key: 'orders', label: 'Order & Payment History', icon: 'receipt_long' },
              { key: 'notifications', label: `Notifications (${notifications?.length ?? 0})`, icon: 'notifications' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-label-md whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/20 border border-primary text-primary font-semibold shadow-sm shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'
              }`}
            >
              <Icon name={tab.icon} className='text-[18px]' />
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => {
              logout()
              router.replace('/')
            }}
            className='ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 border border-error/40 text-error text-label-md hover:bg-error/20 transition-colors whitespace-nowrap'
          >
            <Icon name='logout' className='text-[18px]' />
            Sign Out
          </button>
        </div>
      </section>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        <section className='lg:col-span-7 flex flex-col gap-4'>
          {activeTab === 'tickets' && (
            <>
              <div className='flex items-center gap-2'>
                <span className='w-2.5 h-2.5 rounded-full bg-secondary animate-ping'></span>
                <h2 className='text-headline-sm font-display tracking-wide text-on-surface'>ACTIVE WALLET PASS</h2>
              </div>
              {paidOrders.length === 0 ? (
                <div className='bg-surface-container rounded-2xl border border-outline-variant/50 p-10 flex flex-col items-center gap-3 text-center'>
                  <Icon name='confirmation_number' className='text-[48px] text-outline' />
                  <p className='text-headline-md font-display text-on-surface'>No active passes</p>
                  <p className='text-body-md text-on-surface-variant max-w-sm'>
                    Purchase a ticket to see your digital pass with a scannable code right here.
                  </p>
                </div>
              ) : (
                paidOrders.map((order) =>
                  order.tickets.map((ticket, idx) => {
                    const visual = getEventVisual(ticket.eventId)
                    return (
                      <div
                        key={`${order.id}-${ticket.eventId}-${idx}`}
                        className='bg-surface-container rounded-2xl border border-outline-variant/50 overflow-hidden shadow-2xl relative'
                      >
                        <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${visual.gradient}`}>
                          <div className='absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-container to-transparent'></div>
                          <div className='absolute top-4 left-4 flex items-center gap-2'>
                            <span className='px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/40 text-secondary text-label-sm flex items-center gap-1'>
                              <span className='w-1.5 h-1.5 rounded-full bg-secondary'></span>
                              Official Pass
                            </span>
                          </div>
                          <div className='absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/60 shadow-lg'>
                            <span className='relative flex h-2.5 w-2.5'>
                              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75'></span>
                              <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary'></span>
                            </span>
                            <span className='text-label-sm text-on-surface font-semibold tracking-wide'>
                              GATE VALIDATED
                            </span>
                          </div>
                          <div className='absolute bottom-4 left-4 right-4'>
                            <h3 className='text-headline-md font-display text-on-surface leading-tight drop-shadow-md'>
                              {ticket.eventName}
                            </h3>
                            <p className='text-body-sm text-on-surface-variant flex items-center gap-2 mt-1'>
                              <Icon name='location_on' className='text-[16px] text-secondary' />
                              {visual.venue}
                              <span className='text-outline'>•</span>
                              <Icon name='schedule' className='text-[16px] text-primary' />
                              {visual.date}
                            </p>
                          </div>
                        </div>
                        <div className='p-6 bg-surface-container grid grid-cols-2 sm:grid-cols-4 gap-4'>
                          <div className='p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col'>
                            <span className='text-label-sm text-outline'>Tier</span>
                            <span className='text-label-lg text-primary font-bold mt-0.5'>General Adm.</span>
                          </div>
                          <div className='p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col'>
                            <span className='text-label-sm text-outline'>Qty</span>
                            <span className='text-label-lg text-on-surface font-bold mt-0.5'>
                              {ticket.quantity} pass{ticket.quantity > 1 ? 'es' : ''}
                            </span>
                          </div>
                          <div className='p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col'>
                            <span className='text-label-sm text-outline'>Paid</span>
                            <span className='text-label-lg text-on-surface font-bold mt-0.5'>
                              {formatCurrency(ticket.ticketPrice * ticket.quantity)}
                            </span>
                          </div>
                          <div className='p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col'>
                            <span className='text-label-sm text-outline'>Order</span>
                            <span className='text-label-lg text-secondary font-bold mt-0.5 truncate'>{order.id}</span>
                          </div>
                        </div>
                        <div className='relative flex items-center justify-between py-1 bg-surface-container'>
                          <div className='w-6 h-6 rounded-full bg-background -ml-3 border-r border-outline-variant/50'></div>
                          <div className='w-full border-b-2 border-dashed border-outline-variant/40 mx-2'></div>
                          <div className='w-6 h-6 rounded-full bg-background -mr-3 border-l border-outline-variant/50'></div>
                        </div>
                        <div className='p-6 bg-surface-container-low flex flex-col items-center text-center'>
                          <div className='p-4 rounded-xl bg-surface-container-lowest border-2 border-primary/50 shadow-[0_0_24px_rgba(139,92,246,0.3)] relative'>
                            <div className='w-40 h-40 flex items-center justify-center gap-1 rounded-lg overflow-hidden relative'>
                              {[...Array(5)].map((_, row) => (
                                <div key={row} className='flex flex-col gap-1'>
                                  {[...Array(5)].map((__, col) => (
                                    <span
                                      key={col}
                                      className={`w-6 h-1.5 ${
                                        (row * 5 + col + order.id.length) % 3 === 0
                                          ? 'bg-on-surface'
                                          : 'bg-surface-container-high'
                                      }`}
                                    />
                                  ))}
                                </div>
                              ))}
                              <div className='absolute inset-x-0 h-1 bg-primary-container shadow-[0_0_8px_#a078ff] animate-pulse top-1/2'></div>
                            </div>
                          </div>
                          <span className='mt-4 text-label-md text-on-surface font-mono tracking-widest uppercase'>
                            SEC-{order.id.replace(/\D/g, '').slice(-8) || '0000-0000'}
                          </span>
                          <p className='text-body-sm text-outline mt-1'>Dynamic code rotates every 60s at gate sync.</p>
                          <div className='mt-3'>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className='flex items-center gap-2'>
                <Icon name='receipt_long' className='text-[18px] text-primary' />
                <h2 className='text-headline-sm font-display tracking-wide text-on-surface'>ORDER & PAYMENT HISTORY</h2>
              </div>
              {isFetchingOrders ? (
                <div className='flex flex-col items-center gap-4 py-16 text-on-surface-variant'>
                  <div className='w-12 h-12 rounded-full border-2 border-outline-variant border-t-primary animate-spin'></div>
                  <span className='text-label-lg'>Loading orders…</span>
                </div>
              ) : orders?.length === 0 ? (
                <div className='bg-surface-container rounded-2xl border border-outline-variant/50 p-10 flex flex-col items-center gap-3 text-center'>
                  <Icon name='receipt_long' className='text-[48px] text-outline' />
                  <p className='text-headline-md font-display text-on-surface'>No orders yet</p>
                  <p className='text-body-md text-on-surface-variant'>Your purchase history will appear here.</p>
                </div>
              ) : (
                orders?.map((order) => (
                  <div
                    key={order.id}
                    className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <span className='text-label-sm text-outline uppercase tracking-wider'>Order {order.id}</span>
                        <p className='text-body-sm text-on-surface-variant mt-0.5'>{formatDate(order.createdAt)}</p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <StatusBadge status={order.status} />
                        <span className='text-headline-md font-display font-bold text-on-surface'>
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                    <div className='mt-3 pt-3 border-t border-outline-variant/20 flex flex-wrap gap-2'>
                      {order.tickets.map((ticket, idx) => (
                        <span
                          key={idx}
                          className='px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-label-sm text-on-surface-variant'
                        >
                          {ticket.quantity}x {ticket.eventName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className='flex items-center gap-2'>
                <Icon name='notifications' className='text-[18px] text-primary' />
                <h2 className='text-headline-sm font-display tracking-wide text-on-surface'>LIVE NOTIFICATIONS</h2>
              </div>
              {sortedNotifications.length === 0 ? (
                <div className='bg-surface-container rounded-2xl border border-outline-variant/50 p-10 flex flex-col items-center gap-3 text-center'>
                  <Icon name='notifications_none' className='text-[48px] text-outline' />
                  <p className='text-headline-md font-display text-on-surface'>No notifications</p>
                  <p className='text-body-md text-on-surface-variant'>
                    Realtime updates about your orders appear here.
                  </p>
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  {sortedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${
                        notif.type === 'TICKETS_CONFIRMED'
                          ? 'bg-tertiary-container/10 border-tertiary-container/30'
                          : 'bg-error/10 border-error/30'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === 'TICKETS_CONFIRMED'
                            ? 'bg-tertiary-container/20 text-tertiary'
                            : 'bg-error/20 text-error'
                        }`}
                      >
                        <Icon
                          name={notif.type === 'TICKETS_CONFIRMED' ? 'confirmation_number' : 'link_off'}
                          className='text-[18px]'
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
            </>
          )}
        </section>

        <aside className='lg:col-span-5 flex flex-col gap-4'>
          <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-secondary'>
                <Icon name='account_balance_wallet' className='text-[16px]' />
              </div>
              <h3 className='text-headline-sm font-display text-on-surface'>Wallet Summary</h3>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between items-end border-b border-outline-variant/20 pb-3'>
                <span className='text-body-md text-on-surface-variant'>Total spend (paid)</span>
                <span className='text-headline-md font-display font-bold text-primary'>
                  {formatCurrency(
                    orders?.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0) ?? 0
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-body-md text-on-surface-variant'>Orders placed</span>
                <span className='text-label-lg font-bold text-on-surface'>{orders?.length ?? 0}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-body-md text-on-surface-variant'>Pending / declined</span>
                <span className='text-label-lg font-bold text-on-surface'>
                  {orders?.filter((o) => o.status !== 'PAID').length ?? 0}
                </span>
              </div>
            </div>
          </div>
          <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                <Icon name='verified_user' className='text-[16px]' />
              </div>
              <h3 className='text-headline-sm font-display text-on-surface'>Account Security</h3>
            </div>
            <p className='text-body-sm text-on-surface-variant'>
              All order and payment activity is verified against the auth gateway before any live order status update is
              streamed to this wallet.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default ProfileList
