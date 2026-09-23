import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const useStateParams = (key: string, fallback = '') => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const value = searchParams.get(key) ?? fallback

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set(key, next)
      else params.delete(key)
      const qs = params.toString()
      router.replace(qs ? `/?${qs}` : '/')
    },
    [key, router, searchParams]
  )

  return [value, setValue] as const
}

export default useStateParams
