import { useEffect, useRef } from 'react'
import { subscribe, type SubscribeOptions } from '@/api/websocket/graphql-ws-client'

const useSubscription = <TPayload>(options: SubscribeOptions<TPayload>, deps: unknown[] = []) => {
  const latestOptions = useRef(options)

  useEffect(() => {
    latestOptions.current = options
  })

  useEffect(() => {
    return subscribe<TPayload>({
      url: latestOptions.current.url,
      query: latestOptions.current.query,
      variables: latestOptions.current.variables,
      operationName: latestOptions.current.operationName,
      onNext: (payload) => latestOptions.current.onNext(payload),
      onError: (error) => latestOptions.current.onError?.(error),
      onComplete: () => latestOptions.current.onComplete?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export default useSubscription
