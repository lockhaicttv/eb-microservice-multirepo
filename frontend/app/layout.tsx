import type { ReactNode } from 'react'
import Providers from '@/app/providers'
import TopNav from '@/containers/layout/TopNav'
import Footer from '@/containers/layout/Footer'
import './globals.css'

export const metadata = {
  title: {
    default: 'Pulse Events — Explore & Browse Events',
    template: '%s | Pulse Events'
  },
  description: 'Discover and book the best live events, concerts and festivals.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className='dark'>
      <head>
        {/* eslint-disable @next/next/no-page-custom-font -- Web fonts loaded via stylesheet links; next/font/google is broken under Turbopack dev ("queries have exactly one entry", vercel/next.js#97344) */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap'
        />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
        />
        {/* eslint-enable @next/next/no-page-custom-font */}
      </head>
      <body className='min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased'>
        <Providers>
          <TopNav />
          <div className='flex-1 flex flex-col'>{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
