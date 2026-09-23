'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Icon from '@/components/Icon'

const LoadingState = () => (
  <div className='flex flex-col items-center justify-center gap-4 py-24 text-on-surface-variant'>
    <div className='w-12 h-12 rounded-full border-2 border-outline-variant border-t-primary animate-spin'></div>
    <span className='text-label-lg'>Loading Pulse Events…</span>
  </div>
)

const EmptyState = () => {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-24 text-center'>
      <Icon name='search_off' className='text-[48px] text-outline' />
      <h3 className='text-headline-md font-display text-on-surface'>No events found</h3>
      <p className='text-body-md text-on-surface-variant max-w-sm'>
        {search
          ? `Nothing matches "${search}". Try a different search or reset your filters.`
          : 'There are no events to show right now. Check back soon.'}
      </p>
    </div>
  )
}

const EventsError = () => (
  <div className='flex flex-col items-center justify-center gap-3 py-24 text-center'>
    <Icon name='cloud_off' className='text-[48px] text-error' />
    <h3 className='text-headline-md font-display text-on-surface'>Events are unreachable</h3>
    <p className='text-body-md text-on-surface-variant max-w-sm'>
      The catalog service isn&apos;t responding on this machine. Verify demo-microservice-multirepo BFFs are running,
      then retry.
    </p>
  </div>
)

const PageState = () => (
  <Suspense>
    <EmptyState />
  </Suspense>
)

export { LoadingState, EmptyState, EventsError, PageState }
export default LoadingState
