'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import StatusBadge from '@/components/StatusBadge'
import useCreateOrder from '@/containers/Checkout/hooks/useCreateOrder'
import useOrderUpdatedSubscription from '@/containers/Checkout/hooks/useOrderUpdatedSubscription'
import useGetPayments from '@/containers/Checkout/hooks/useGetPayments'
import useGetOrder from '@/containers/Checkout/hooks/useGetOrder'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { DEFAULT_ORDER_TOTAL_LIMIT } from '@/constants/env'
import type { OrderModel, OrderStatus, OrderStatusUpdateModel } from '@/types/api.types'

const ORDER_STEPS: Array<{ key: OrderStatus; label: string; icon: string }> = [
  { key: 'PENDING', label: 'Order Placed', icon: 'receipt_long' },
  { key: 'PAID', label: 'Payment Confirmed', icon: 'credit_score' },
  { key: 'DECLINED', label: 'Declined', icon: 'block' }
]

const CheckoutList = () => {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const accessToken = useStore((state) => state.accessToken)
  const cart = useStore((state) => state.cart)
  const cartTotal = useStore((state) => state.cartTotal)
  const clearCart = useStore((state) => state.clearCart)

  const [createdOrder, setCreatedOrder] = useState<OrderModel | null>(null)
  const [liveStatus, setLiveStatus] = useState<OrderStatusUpdateModel | null>(null)

  const createOrderMutation = useCreateOrder()
  const total = cartTotal(cart)

  useOrderUpdatedSubscription((update) => {
    setLiveStatus((prev) => (prev && prev.orderId !== update.orderId ? prev : update))
  })

  const activeOrderId = createdOrder?.id

  const { data: polledOrder } = useGetOrder(activeOrderId ?? '', Boolean(activeOrderId && !liveStatus))
  const { data: payments } = useGetPayments(activeOrderId ?? '', Boolean(activeOrderId))

  useEffect(() => {
    if (!accessToken) router.replace('/login')
  }, [accessToken, router])

  const order: OrderModel | null =
    createdOrder && liveStatus && liveStatus.orderId === createdOrder.id
      ? { ...createdOrder, status: liveStatus.status }
      : (polledOrder ?? createdOrder)

  const status: OrderStatus | null = (order?.status as OrderStatus | undefined) ?? null

  const handleConfirm = () => {
    if (cart.length === 0 || !accessToken) return
    createOrderMutation.mutate(
      cart.map((item) => ({ eventId: item.eventId, quantity: item.quantity })),
      {
        onSuccess: (order) => {
          setCreatedOrder(order)
          clearCart()
        }
      }
    )
  }

  const stepIndex = status === 'DECLINED' ? -1 : status === 'PAID' ? 2 : status === 'PENDING' ? 0 : -1

  return (
    <main className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
      {!order && total > DEFAULT_ORDER_TOTAL_LIMIT && (
        <div className='mb-6 flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30 text-error'>
          <Icon name='warning' className='text-[20px] shrink-0' />
          <div>
            <p className='text-label-lg font-bold'>Large transaction</p>
            <p className='text-body-sm'>
              Demo payment gateway approves orders up to {formatCurrency(DEFAULT_ORDER_TOTAL_LIMIT)}. This order (
              {formatCurrency(total)}) will be declined automatically.
            </p>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        <div className='lg:col-span-7 flex flex-col gap-6'>
          <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 relative overflow-hidden'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <div className='w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-secondary'>
                  <Icon name='person' className='text-[16px]' />
                </div>
                <h2 className='text-headline-sm font-display text-on-surface'>Your Selection</h2>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className='flex flex-col items-center gap-3 py-8 text-center'>
                <Icon name='shopping_cart' className='text-[40px] text-outline' />
                <p className='text-body-md text-on-surface-variant'>No tickets selected yet.</p>
                <Link
                  href='/'
                  className='px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold'
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className='flex flex-col gap-3.5'>
                {cart.map((item) => (
                  <div
                    key={item.eventId}
                    className='flex items-center justify-between p-3.5 rounded-lg bg-surface-container border border-outline-variant/30'
                  >
                    <div className='flex flex-col'>
                      <span className='text-label-lg font-semibold text-on-surface'>{item.eventName}</span>
                      <span className='text-body-sm text-outline'>
                        {item.quantity}x General Admission · {formatCurrency(item.ticketPrice)} each
                      </span>
                    </div>
                    <span className='text-label-lg font-semibold text-on-surface'>
                      {formatCurrency(item.ticketPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {order && (
            <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <div className='w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                    <Icon name='bolt' className='text-[16px]' />
                  </div>
                  <h2 className='text-headline-sm font-display text-on-surface'>Realtime Order Status</h2>
                </div>
                {status && <StatusBadge status={status} />}
              </div>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                {ORDER_STEPS.map((step, idx) => {
                  const isBlocked = status === 'DECLINED' && idx >= 1
                  const isDone = stepIndex >= 0 && idx <= stepIndex && status !== 'DECLINED'
                  const isCurrent = idx === stepIndex
                  return (
                    <div key={step.key} className='flex items-center gap-2 flex-1 w-full'>
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border flex-1 ${
                          isBlocked
                            ? 'bg-error/10 border-error/30 text-error'
                            : isDone
                              ? 'bg-tertiary-container/15 border-tertiary-container/40 text-tertiary'
                              : isCurrent
                                ? 'bg-secondary/15 border-secondary/40 text-secondary animate-pulse'
                                : 'bg-surface-container border-outline-variant/30 text-outline'
                        }`}
                      >
                        <Icon name={step.icon} className='text-[18px]' />
                        <span className='text-label-md font-semibold'>{step.label}</span>
                      </div>
                      {idx < ORDER_STEPS.length - 1 && (
                        <Icon name='chevron_right' className='text-[18px] text-outline shrink-0 hidden sm:block' />
                      )}
                    </div>
                  )
                })}
              </div>

              {status === 'DECLINED' && (
                <div className='mt-4 p-4 rounded-lg bg-error/10 border border-error/30'>
                  <p className='text-label-lg font-bold text-error flex items-center gap-2'>
                    <Icon name='gpp_bad' className='text-[20px]' />
                    Payment Declined
                  </p>
                  <p className='text-body-sm text-on-surface-variant mt-1'>
                    {payments?.[0]?.reason ??
                      `This order exceeded the demo approval limit of ${formatCurrency(DEFAULT_ORDER_TOTAL_LIMIT)}.`}
                  </p>
                </div>
              )}

              <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='p-4 rounded-lg bg-surface-container border border-outline-variant/30'>
                  <span className='text-label-sm text-outline uppercase tracking-wider'>Payment Record</span>
                  <div className='mt-1 flex items-center justify-between gap-2'>
                    <span className='text-body-md text-on-surface-variant truncate'>Order {order.id}</span>
                    <StatusBadge status={payments?.[0]?.status ?? status ?? 'PENDING'} />
                  </div>
                  <p className='text-body-sm text-outline mt-1'>
                    {payments?.[0] ? `Processed ${formatDate(payments[0].createdAt)}` : 'Awaiting payment decision…'}
                  </p>
                </div>
                <div className='p-4 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col'>
                  <span className='text-label-sm text-outline uppercase tracking-wider'>Order Total</span>
                  <p className='text-headline-md font-display font-bold text-primary mt-1'>
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='lg:col-span-5 sticky top-24'>
          <div className='bg-surface-container-low border border-outline-variant/40 rounded-xl overflow-hidden shadow-lg'>
            <div className='relative h-40 w-full overflow-hidden bg-surface-container'>
              <div className='absolute inset-0 bg-gradient-to-br from-violet-500/40 via-purple-800/20 to-surface-container-low'></div>
              <div className='absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent'></div>
              <div className='absolute top-3 left-3 flex gap-2'>
                <span className='px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary text-label-sm border border-secondary/30 flex items-center gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-secondary live-pulse-dot'></span>
                  Official Pass
                </span>
              </div>
            </div>
            <div className='px-6 pt-2 pb-4'>
              <h3 className='text-headline-md font-display font-bold text-on-surface leading-snug'>
                {cart[0]?.eventName ?? order?.tickets[0]?.eventName ?? 'Order Summary'}
              </h3>
              <div className='flex flex-col gap-2 mt-3 text-body-sm text-on-surface-variant'>
                <div className='flex items-center gap-2'>
                  <Icon name='confirmation_number' className='text-[18px] text-primary' />
                  <span>
                    {order
                      ? `Order ${order.id}`
                      : `${cart.length} ${cart.length === 1 ? 'item' : 'items'} in selection`}
                  </span>
                </div>
                {user && (
                  <div className='flex items-center gap-2'>
                    <Icon name='person' className='text-[18px] text-primary' />
                    <span>
                      {user.name} · {user.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className='h-px bg-outline-variant/20 mx-6'></div>
            <div className='p-6 flex flex-col gap-3.5'>
              <h4 className='text-label-md text-outline uppercase tracking-wider'>Pass Breakdown</h4>
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.eventId} className='flex justify-between items-start'>
                    <div>
                      <div className='text-label-lg text-on-surface font-semibold'>
                        {item.quantity}x {item.eventName}
                      </div>
                      <div className='text-body-sm text-outline'>
                        {formatCurrency(item.ticketPrice)} per pass · Instant delivery
                      </div>
                    </div>
                    <div className='text-label-lg font-semibold text-on-surface'>
                      {formatCurrency(item.ticketPrice * item.quantity)}
                    </div>
                  </div>
                ))
              ) : order ? (
                order.tickets.map((ticket) => (
                  <div key={ticket.eventId} className='flex justify-between items-start'>
                    <div>
                      <div className='text-label-lg text-on-surface font-semibold'>
                        {ticket.quantity}x {ticket.eventName}
                      </div>
                      <div className='text-body-sm text-outline'>
                        {formatCurrency(ticket.ticketPrice)} per pass · Instant delivery
                      </div>
                    </div>
                    <div className='text-label-lg font-semibold text-on-surface'>
                      {formatCurrency(ticket.ticketPrice * ticket.quantity)}
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-body-sm text-on-surface-variant'>Selection is empty.</p>
              )}
              <div className='relative py-2'>
                <div className='border-t border-dashed border-outline-variant/40'></div>
              </div>
              <div className='flex justify-between items-end'>
                <div>
                  <span className='text-label-md text-outline uppercase tracking-wider block'>Total Due</span>
                  <span className='text-[34px] leading-[40px] font-display font-bold text-primary tracking-tight'>
                    {formatCurrency(order?.totalAmount ?? total)}
                  </span>
                </div>
                <div className='text-right'>
                  <span className='text-label-sm text-secondary font-medium block'>All taxes & fees included</span>
                  <span className='text-body-sm text-outline'>USD Currency</span>
                </div>
              </div>
            </div>
            <div className='bg-surface-container p-5 border-t border-outline-variant/20 flex flex-col gap-2.5'>
              <div className='flex items-center gap-2 text-label-md text-on-surface'>
                <Icon name='verified_user' className='text-[18px] text-secondary' filled />
                <span>100% Buyer Verified Guarantee</span>
              </div>
            </div>
            <div className='p-5 pt-2'>
              <button
                onClick={handleConfirm}
                disabled={cart.length === 0 || createOrderMutation.isPending}
                className='w-full min-h-[48px] py-3.5 px-6 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(160,120,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Icon name='sync' className='text-[20px] animate-spin' />
                    Creating order…
                  </>
                ) : (
                  <>
                    Confirm & Purchase
                    <Icon name='lock' className='text-[18px]' filled />
                  </>
                )}
              </button>
              {createOrderMutation.error && (
                <p className='text-body-sm text-error text-center mt-3'>
                  {(createOrderMutation.error as Error).message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default CheckoutList
