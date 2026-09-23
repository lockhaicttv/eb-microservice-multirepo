'use client'

import Link from 'next/link'
import Icon from '@/components/Icon'
import { formatCurrency } from '@/utils/formatters'
import { getEventVisual } from '@/constants/event-visuals.constants'
import type { EventModel } from '@/types/api.types'

const EventCard = ({ event }: { event: EventModel }) => {
  const visual = getEventVisual(event.id)

  return (
    <Link href={`/events/${event.id}`} className='group block'>
      <article className='bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all duration-200'>
        <div className='relative h-48 overflow-hidden bg-surface-container'>
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient}`}></div>
          <div className='absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent'></div>
          <div className='absolute top-3 left-3 flex gap-2'>
            <span className='px-2.5 py-1 rounded-full text-label-sm bg-surface-container-lowest/80 backdrop-blur-md text-secondary border border-secondary/30'>
              {visual.category}
            </span>
          </div>
          <div className='absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-container-lowest/70 backdrop-blur-md flex items-center justify-center text-on-surface'>
            <Icon name={visual.icon} className='text-[20px]' />
          </div>
          <div className='absolute bottom-2.5 left-3 text-label-sm text-primary flex items-center gap-1 font-semibold'>
            <Icon name='calendar_month' className='text-[16px]' />
            <span>{visual.date}</span>
          </div>
        </div>
        <div className='p-4 flex flex-col gap-3 flex-1'>
          <div>
            <h3 className='text-headline-sm font-display text-on-surface group-hover:text-primary transition-colors line-clamp-2'>
              {event.title}
            </h3>
            <p className='text-body-sm text-on-surface-variant mt-1 flex items-center gap-1'>
              <Icon name='location_on' className='text-[16px] text-outline' />
              {visual.venue}
            </p>
          </div>
          <div className='mt-auto flex items-center justify-between pt-3 border-t border-outline-variant/20'>
            <div className='flex flex-col'>
              <span className='text-label-sm text-outline'>Tickets from</span>
              <span className='text-headline-md font-display font-bold text-on-surface'>
                {formatCurrency(event.ticketPrice)}
              </span>
            </div>
            <div className='flex flex-col items-end gap-1'>
              {event.ticketsLeft < 50 && (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/15 text-error text-label-sm font-bold'>
                  <span className='w-1.5 h-1.5 rounded-full bg-error live-pulse-dot'></span>
                  Selling Fast
                </span>
              )}
              <span className='text-body-sm text-on-surface-variant'>{event.ticketsLeft} left</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default EventCard
