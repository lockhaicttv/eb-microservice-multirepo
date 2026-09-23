'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { LoadingState, EventsError } from '@/components/StateViews'
import useGetEvent from '@/containers/EventDetail/hooks/useGetEvent'
import { getEventVisual } from '@/constants/event-visuals.constants'
import { formatCurrency } from '@/utils/formatters'
import { useStore } from '@/store/useStore'

const MAX_PER_TRANSACTION = 4

const EventDetail = ({ eventId }: { eventId: string }) => {
  const router = useRouter()
  const [quantity, setQuantity] = useState(0)
  const addToCart = useStore((state) => state.addToCart)

  const { data: event, isLoading, isError } = useGetEvent(eventId)

  const visual = useMemo(() => (event ? getEventVisual(event.id) : getEventVisual('e-1')), [event])

  const handleCheckout = () => {
    if (!event) return
    addToCart({
      eventId: event.id,
      eventName: event.title,
      ticketPrice: event.ticketPrice,
      ticketsLeft: event.ticketsLeft,
      quantity
    })
    router.push('/checkout')
  }

  if (isLoading) return <LoadingState />
  if (isError || !event) return <EventsError />

  const soldOut = event.ticketsLeft <= 0

  return (
    <main className='w-full max-w-7xl mx-auto px-6 py-8 flex-1'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        <section className='lg:col-span-8 flex flex-col gap-8'>
          <div className='relative w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low group shadow-2xl'>
            <div className={`relative h-[380px] w-full overflow-hidden bg-gradient-to-br ${visual.gradient}`}>
              <div className='absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-container-low to-transparent'></div>
              <div className='absolute inset-0 flex items-center justify-center opacity-40'>
                <Icon name={visual.icon} className='text-[140px] text-on-surface' />
              </div>
              <div className='absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent'></div>
            </div>
            <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-3'>
              <div className='flex flex-wrap items-center gap-2'>
                {event.ticketsLeft < 50 && (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary-container text-tertiary text-label-sm shadow-[0_0_12px_rgba(255,81,106,0.35)]'>
                    <span className='w-2 h-2 rounded-full bg-tertiary animate-ping'></span>
                    {event.ticketsLeft < 20 ? 'Selling Fast · Nearly Gone' : 'Selling Fast'}
                  </span>
                )}
                <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-highest/80 backdrop-blur-md border border-outline-variant/40 text-on-surface text-label-sm'>
                  <Icon name='verified' className='text-[14px] text-secondary' filled />
                  Official Partner
                </span>
              </div>
              <h1 className='text-display-hero font-display text-on-surface tracking-tight leading-none drop-shadow-md'>
                {event.title}
              </h1>
              <p className='text-body-md text-on-surface-variant max-w-2xl'>{event.blurb}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl bg-surface-container border border-outline-variant/30'>
            <div className='flex items-start gap-3.5'>
              <div className='w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30 shrink-0'>
                <Icon name='calendar_month' className='text-[20px]' />
              </div>
              <div className='flex flex-col'>
                <span className='text-label-sm text-outline uppercase tracking-wider'>Date & Schedule</span>
                <span className='text-body-md font-semibold text-on-surface'>{visual.date}</span>
                <span className='text-body-sm text-on-surface-variant'>Doors open 1 hour early</span>
              </div>
            </div>
            <div className='flex items-start gap-3.5 md:border-l md:border-outline-variant/20 md:pl-4'>
              <div className='w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/30 shrink-0'>
                <Icon name='pin_drop' className='text-[20px]' />
              </div>
              <div className='flex flex-col'>
                <span className='text-label-sm text-outline uppercase tracking-wider'>Location</span>
                <span className='text-body-md font-semibold text-on-surface'>{visual.venue}</span>
                <span className='text-body-sm text-on-surface-variant'>{event.ticketsLeft} tickets remaining</span>
              </div>
            </div>
          </div>
        </section>

        <aside className='lg:col-span-4'>
          <div className='relative rounded-xl bg-surface-container-low border border-outline-variant/30 overflow-hidden'>
            <div className='absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-secondary'></div>
            <div className='p-5'>
              <div className='flex items-center justify-between pb-4 border-b border-outline-variant/30'>
                <div>
                  <h2 className='text-headline-sm font-display text-on-surface font-bold'>Select Tickets</h2>
                  <p className='text-body-sm text-outline'>Max {MAX_PER_TRANSACTION} passes per transaction</p>
                </div>
                <div className='flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/40 text-label-sm text-on-surface-variant'>
                  <Icon name='lock' className='text-[14px] text-secondary' filled />
                  Secured
                </div>
              </div>

              <div className='py-4 space-y-3.5'>
                <div
                  className={`p-4 rounded-lg flex flex-col gap-2.5 transition-all ${
                    quantity > 0
                      ? 'bg-surface-container-high border-2 border-primary shadow-[0_0_16px_rgba(208,188,255,0.15)]'
                      : 'bg-surface-container-low border border-outline-variant/30 hover:border-secondary/40'
                  }`}
                >
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='text-label-lg font-bold text-on-surface'>General Admission</span>
                        {!soldOut && (
                          <span className='px-2 py-0.5 rounded-full text-label-sm bg-primary/20 text-primary border border-primary/30 font-semibold'>
                            Most Popular
                          </span>
                        )}
                      </div>
                      <p className='text-body-sm text-on-surface-variant mt-0.5'>
                        {soldOut ? 'All tickets allocated' : `Standard entry ticket`}
                      </p>
                    </div>
                    <span className='text-headline-sm font-bold text-primary'>{formatCurrency(event.ticketPrice)}</span>
                  </div>

                  <div className='flex items-center justify-between pt-2 border-t border-outline-variant/30'>
                    <span className='text-body-sm text-outline'>
                      Subtotal:{' '}
                      <strong className='text-on-surface font-semibold'>
                        {formatCurrency(event.ticketPrice * quantity)}
                      </strong>
                    </span>
                    <div className='flex items-center gap-3 bg-surface-container rounded-lg border border-outline-variant/40 px-2 py-1'>
                      <button
                        disabled={quantity <= 0 || soldOut}
                        onClick={() => setQuantity((q) => q - 1)}
                        className='text-primary hover:text-on-surface transition-colors p-0.5 disabled:text-outline disabled:cursor-not-allowed'
                        title='Decrease count'
                      >
                        <Icon name='remove' className='text-[16px]' />
                      </button>
                      <span className='text-label-lg font-bold text-on-surface px-1'>{quantity}</span>
                      <button
                        disabled={quantity >= MAX_PER_TRANSACTION || soldOut}
                        onClick={() => setQuantity((q) => q + 1)}
                        className='text-primary hover:text-on-surface transition-colors p-0.5 disabled:text-outline disabled:cursor-not-allowed'
                        title='Increase count'
                      >
                        <Icon name='add' className='text-[16px]' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between py-4 border-t border-b border-outline-variant/30'>
                <span className='text-headline-sm font-bold text-on-surface'>Order Total</span>
                <span className='text-headline-sm font-bold text-primary'>
                  {formatCurrency(event.ticketPrice * quantity)}
                </span>
              </div>

              <div className='pt-5 flex flex-col gap-3'>
                <button
                  onClick={handleCheckout}
                  disabled={quantity <= 0}
                  className='w-full min-h-[48px] py-3.5 px-6 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(160,120,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40'
                >
                  <span>Proceed to Checkout</span>
                  <Icon name='arrow_forward' className='text-[20px]' />
                </button>
                <div className='flex flex-col gap-2 pt-1 text-center'>
                  <div className='flex items-center justify-center gap-1.5 text-body-sm text-on-surface-variant'>
                    <Icon name='verified_user' className='text-[16px] text-secondary' filled />
                    <span>100% Buyer Verified Guarantee</span>
                  </div>
                  <div className='flex items-center justify-center gap-1.5 text-body-sm text-outline'>
                    <Icon name='bolt' className='text-[16px] text-primary' />
                    <span>Instant mobile ticket delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6 rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex items-center justify-between'>
            <div className='flex flex-col gap-1'>
              <span className='text-label-sm text-primary uppercase tracking-widest'>Category</span>
              <span className='text-body-md font-semibold text-on-surface'>{visual.category}</span>
            </div>
            <span className='text-body-sm text-on-surface-variant'>{event.ticketsLeft} available</span>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default EventDetail
