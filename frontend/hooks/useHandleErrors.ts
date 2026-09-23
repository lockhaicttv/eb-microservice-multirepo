import { useCallback } from 'react'

interface APIErrorShape {
  response?: { errors?: Array<{ message?: string }> }
  message?: string
}

export const useHandleErrors = () => {
  const handleAPIError = useCallback((error: unknown): string => {
    const err = error as APIErrorShape | undefined
    const message = err?.response?.errors?.[0]?.message ?? err?.message ?? 'Something went wrong. Please try again.'
    return message
  }, [])
  return { handleAPIError }
}

export default useHandleErrors
