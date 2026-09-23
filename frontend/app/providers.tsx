'use client'

import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/get-query-client'

const Providers = ({ children }: { children: ReactNode }) => {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}

export default Providers
