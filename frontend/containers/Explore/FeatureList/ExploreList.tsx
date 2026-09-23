'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'
import EventCard from '@/components/EventCard'
import { LoadingState, EmptyState, EventsError } from '@/components/StateViews'
import useGetEvents from '@/containers/Explore/hooks/useGetEvents'
import { getEventVisual, CATEGORIES } from '@/constants/event-visuals.constants'
import { formatCurrency } from '@/utils/formatters'
import useStateParams from '@/containers/Explore/hooks/useStateParams'

const ExploreList = () => {
  const [activeCategory, setActiveCategory] = useState('All Events')
  const [search] = useStateParams('search')

  const { data, isLoading, isError, isRefetching } = useGetEvents(search || undefined)

  const filtered = useMemo(() => {
    if (!data) return []
    if (activeCategory === 'All Events') return data
    return data.filter((event) => getEventVisual(event.id).category === activeCategory)
  }, [data, activeCategory])

  const featured = useMemo(() => filtered[0], [filtered])

  return (
    <div className='max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-8'>
      <aside className='w-full lg:w-72 flex-shrink-0 flex flex-col gap-6'>
        <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 shadow-none'>
          <div className='flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/30'>
            <div className='flex items-center gap-2'>
              <Icon name='tune' className='text-primary' />
              <h2 className='text-headline-sm font-display text-on-surface'>Categories</h2>
            </div>
            <button
              onClick={() => setActiveCategory('All Events')}
              className='text-body-sm text-outline hover:text-primary transition-colors'
            >
              Reset
            </button>
          </div>
          <nav className='space-y-1'>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.label
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold border-l-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className='flex items-center gap-2.5'>
                    <Icon name={cat.icon} className='text-[20px]' />
                    <span className='text-label-md'>{cat.label}</span>
                  </div>
                  {isActive && (
                    <span className='px-2 py-0.5 rounded-full text-label-sm bg-primary/20 text-primary'>
                      {filtered.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
        <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-headline-sm font-display text-on-surface'>Price Range</h3>
            <span className='text-label-md text-primary'>
              {data?.length ? `From ${formatCurrency(Math.min(...data.map((e) => e.ticketPrice)))}` : '—'}
            </span>
          </div>
        </div>
        <div className='bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3'>
          <h3 className='text-headline-sm font-display text-on-surface'>Quick Filters</h3>
          <div className='flex flex-wrap gap-2 pt-1'>
            <span className='px-3 py-1.5 rounded-full text-label-sm bg-primary/15 border border-primary text-on-surface flex items-center gap-1.5'>
              <Icon name='local_fire_department' className='text-[16px] text-primary' />
              Selling Fast
            </span>
            <span className='px-3 py-1.5 rounded-full text-label-sm bg-surface-container border border-outline-variant/40 text-on-surface-variant'>
              Live
            </span>
          </div>
        </div>
      </aside>

      <main className='flex-1 flex flex-col gap-8 min-w-0'>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <EventsError />
        ) : (
          <>
            {featured && (
              <section className='relative rounded-2xl overflow-hidden border border-outline-variant/40 hero-glow bg-surface-container-low'>
                <div className='relative w-full h-[360px] md:h-[400px]'>
                  <div className={`absolute inset-0 bg-gradient-to-br ${getEventVisual(featured.id).gradient}`}></div>
                  <div className='absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent'></div>
                  <div className='absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/60 to-transparent'></div>
                  <div className='absolute inset-0 p-6 md:p-8 flex flex-col justify-end'>
                    <div className='flex flex-wrap items-center gap-2 mb-3'>
                      <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-tertiary-container/50 text-tertiary text-label-sm'>
                        <span className='w-2 h-2 rounded-full bg-tertiary-container live-pulse-dot'></span>
                        {getEventVisual(featured.id).badge ?? 'Live Event'}
                      </span>
                      <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/40 text-secondary text-label-sm'>
                        <Icon name='sell' className='text-[16px] text-secondary' />
                        {featured.ticketsLeft < 30 ? 'Selling Fast' : 'Tickets Available'}
                      </span>
                      <span className='px-2.5 py-1 rounded-full bg-surface-container-high/70 backdrop-blur-md text-on-surface-variant text-label-sm'>
                        {getEventVisual(featured.id).venue}
                      </span>
                    </div>
                    <h1 className='text-display-hero font-display text-on-surface max-w-2xl tracking-tight leading-none mb-3 drop-shadow-md'>
                      {featured.title}
                    </h1>
                    <div className='flex flex-wrap items-center gap-y-2 gap-x-6 text-body-md text-on-surface-variant mb-6'>
                      <div className='flex items-center gap-1.5'>
                        <Icon name='calendar_month' className='text-[18px] text-primary' />
                        <span className='text-on-surface font-semibold'>{getEventVisual(featured.id).date}</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <Icon name='sell' className='text-[18px] text-primary' />
                        <span className='text-on-surface font-semibold'>
                          From {formatCurrency(featured.ticketPrice)}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-4'>
                      <Link
                        href={`/events/${featured.id}`}
                        className='px-6 py-3 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold neon-bloom-cta hover:bg-primary transition-all duration-150 flex items-center gap-2 active:scale-95'
                      >
                        <Icon name='confirmation_number' className='text-[20px]' />
                        Book Tickets
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/30'>
              <div className='flex items-center gap-3'>
                <span className='text-headline-sm font-display text-on-surface'>Curated Events</span>
                <span className='text-label-md px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant'>
                  {filtered.length} {filtered.length === 1 ? 'Match' : 'Matches'}
                </span>
                {isRefetching && <Icon name='sync' className='text-[18px] text-secondary animate-spin' />}
              </div>
            </section>

            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <section className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function ExplorePageWrapper() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ExploreList />
    </Suspense>
  )
}
