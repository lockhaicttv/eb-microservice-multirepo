'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import Icon from '@/components/Icon'

const NAV_LINKS = [
  { label: 'Concerts', href: '/' },
  { label: 'Nightlife', href: '/' },
  { label: 'Festivals', href: '/' },
  { label: 'Arts & Theater', href: '/' }
]

const TopNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const submitSearch = (value: string) => {
    router.push(value ? `/?search=${encodeURIComponent(value)}` : '/')
  }

  return (
    <header className='bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm'>
      <div className='flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto gap-4'>
        <div className='flex items-center gap-6 flex-1'>
          <Link
            href='/'
            className='flex items-center gap-2 group text-headline-md font-display font-bold tracking-tight'
          >
            <div className='w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-150'>
              <Icon name='graphic_eq' className='text-primary' />
            </div>
            <span className='tracking-tight text-on-surface'>Pulse Events</span>
          </Link>
          <div className='relative w-full max-w-md hidden md:block'>
            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline'>
              <Icon name='search' className='text-[20px]' />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(search)}
              className='w-full pl-10 pr-4 py-2 bg-surface-container text-on-surface placeholder:text-outline text-body-sm rounded-full border border-outline-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-all'
              placeholder='Search artists, events, venues...'
            />
          </div>
        </div>
        <nav className='hidden lg:flex items-center space-x-6 text-label-lg'>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                pathname === link.href
                  ? 'text-primary font-bold border-b-2 border-primary pb-1 transition-colors duration-150'
                  : 'text-on-surface-variant font-medium hover:text-primary transition-colors duration-150'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className='flex items-center gap-3'>
          <Link
            href='/notifications'
            className='relative p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors'
            title='Notifications'
          >
            <Icon name='notifications' className='text-[22px]' />
            <span className='absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container ring-2 ring-surface'></span>
          </Link>
          <Link
            href='/profile'
            className='flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-surface-container border border-outline-variant/40 hover:border-primary transition-all'
          >
            <span className='text-label-md text-on-surface hidden sm:inline pl-1'>Profile</span>
            <div className='w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm ring-1 ring-primary/40'>
              <Icon name='person' className='text-[16px]' />
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default TopNav
