'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import useGetMyEvents, { useCreateEvent } from '@/containers/OwnerEvents/hooks/useGetMyEvents'
import usePermissions from '@/hooks/usePermissions'
import { formatCurrency } from '@/utils/formatters'
import type { EventModel } from '@/types/api.types'

const MAX_TICKETS = 1_000_000

const Field = ({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <label className='flex flex-col gap-1.5'>
    <span className='text-label-md text-on-surface-variant'>{label}</span>
    {children}
    {hint && <span className='text-label-sm text-outline'>{hint}</span>}
  </label>
)

const inputClass =
  'w-full px-3 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/40 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-all'

/**
 * Create form.
 *
 * Client-side validation is for feedback only. catalog-bff and catalog-backend
 * both re-validate the payload independently, so bypassing this form gets you a
 * server error, not an invalid listing.
 */
const CreateEventForm = () => {
  const router = useRouter()
  const createEvent = useCreateEvent()
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [price, setPrice] = useState('')
  const [tickets, setTickets] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const parsedPrice = Number(price)
    const parsedTickets = Number(tickets)

    if (!title.trim()) return setLocalError('Give the event a title.')
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return setLocalError('Ticket price must be zero or more.')
    if (!Number.isInteger(parsedTickets) || parsedTickets < 0 || parsedTickets > MAX_TICKETS) {
      return setLocalError(`Tickets must be a whole number between 0 and ${MAX_TICKETS.toLocaleString()}.`)
    }

    createEvent.mutate(
      { title: title.trim(), blurb: blurb.trim(), ticketPrice: parsedPrice, tickets: parsedTickets },
      { onSuccess: (created) => router.push(`/events/${created.id}`) }
    )
  }

  const error = localError ?? (createEvent.error instanceof Error ? createEvent.error.message : null)

  return (
    <form onSubmit={submit} className='flex flex-col gap-4 p-5 rounded-xl bg-surface-container border border-outline-variant/30'>
      <h2 className='text-headline-sm font-display text-on-surface'>List a new event</h2>

      <Field label='Title'>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Rooftop Sessions — Vol. 4'
          className={inputClass}
        />
      </Field>

      <Field label='Blurb' hint='Shown on the event page.'>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          rows={3}
          placeholder='Sunset set on the rooftop, local lineup.'
          className={inputClass}
        />
      </Field>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Field label='Ticket price'>
          <input
            type='number'
            min='0'
            step='0.01'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder='45'
            className={inputClass}
          />
        </Field>
        <Field label='Tickets available'>
          <input
            type='number'
            min='0'
            step='1'
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            placeholder='150'
            className={inputClass}
          />
        </Field>
      </div>

      {error && (
        <div className='flex items-start gap-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error'>
          <Icon name='error' className='text-[18px] shrink-0' />
          <p className='text-body-sm'>{error}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={createEvent.isPending}
        className='min-h-[44px] px-6 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed'
      >
        <Icon name='add' className='text-[18px]' />
        {createEvent.isPending ? 'Publishing…' : 'Publish event'}
      </button>
    </form>
  )
}

const OwnerEventRow = ({ event }: { event: EventModel }) => (
  <Link
    href={`/events/${event.id}`}
    className='flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-colors'
  >
    <div className='flex-1 min-w-0'>
      <span className='text-label-lg font-semibold text-on-surface block truncate'>{event.title}</span>
      <span className='text-body-sm text-outline block truncate'>{event.blurb || 'No description'}</span>
    </div>
    <div className='flex items-center gap-4 shrink-0 text-body-sm'>
      <span className='font-semibold text-primary'>{formatCurrency(event.ticketPrice)}</span>
      <span className={event.ticketsLeft > 0 ? 'text-on-surface-variant' : 'text-tertiary'}>
        {event.ticketsLeft > 0 ? `${event.ticketsLeft} left` : 'Sold out'}
      </span>
      <Icon name='chevron_right' className='text-[18px] text-outline' />
    </div>
  </Link>
)

const OwnerEventsList = () => {
  const router = useRouter()
  const { role, hydrated, isAuthenticated, canManageEvents } = usePermissions()
  const { data: events, isLoading, isError, error } = useGetMyEvents()

  // Route guard for the UI. Not a security boundary: catalog-bff rejects
  // `myEvents` for a non-owner token regardless of what this renders.
  //
  // Gated on `hydrated` — before the persisted store rehydrates the session looks
  // logged out, and redirecting then would bounce a real owner off their page.
  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/login')
    else if (!canManageEvents) router.replace('/')
  }, [hydrated, isAuthenticated, canManageEvents, router])

  if (!hydrated || !isAuthenticated || !canManageEvents) return null

  return (
    <main className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
      <div className='flex items-start gap-3 mb-6'>
        <div className='w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0'>
          <Icon name='verified_user' className='text-[22px]' />
        </div>
        <div>
          <h1 className='text-headline-md font-display text-on-surface'>My events</h1>
          <p className='text-body-sm text-outline'>
            Events you host. Signed in as {role}.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        <section className='lg:col-span-7'>
          <h2 className='text-headline-sm font-display text-on-surface mb-4'>
            Listed ({events?.length ?? 0})
          </h2>

          {isLoading && (
            <div className='flex flex-col gap-3'>
              {[0, 1].map((i) => (
                <div key={i} className='h-[76px] rounded-xl bg-surface-container-low animate-pulse' />
              ))}
            </div>
          )}

          {isError && (
            <div className='flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30 text-error'>
              <Icon name='error' className='text-[20px] shrink-0' />
              <p className='text-body-sm'>
                {error instanceof Error ? error.message : 'Failed to load your events.'}
              </p>
            </div>
          )}

          {events && events.length === 0 && (
            <div className='py-10 text-center rounded-xl bg-surface-container-low border border-outline-variant/30'>
              <p className='text-body-md text-on-surface-variant'>You have not listed any events yet.</p>
              <p className='text-body-sm text-outline mt-1'>Use the form to publish your first one.</p>
            </div>
          )}

          <div className='flex flex-col gap-3'>
            {events?.map((event) => (
              <OwnerEventRow key={event.id} event={event} />
            ))}
          </div>
        </section>

        <aside className='lg:col-span-5'>
          <CreateEventForm />
        </aside>
      </div>
    </main>
  )
}

export default OwnerEventsList
