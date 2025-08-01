import { createContext, useContext, useLayoutEffect, useState } from 'react'
import useScript from '../hooks/useScript'
import type { FreshdeskClient } from '../types/freshdesk'

declare global {
  const app: any
}

const FreshdeskClientContext = createContext<{ freshdeskClient: FreshdeskClient | null }>({
  freshdeskClient: null
})

export const FreshdeskProvider = ({ children }: { children: React.ReactNode }) => {
  const [client, setClient] = useState<FreshdeskClient | null>(null)
  const loaded = useScript('{{{appclient}}}')

  useLayoutEffect(() => {
    if (!loaded) return

    const init = async () => {
      const client = await app.initialized()
      setClient(client)
    }

    init()
  }, [loaded])

  return (
    <FreshdeskClientContext.Provider value={{ freshdeskClient: client }}>{children}</FreshdeskClientContext.Provider>
  )
}

export const useFreshdeskClient = () => {
  const { freshdeskClient } = useContext(FreshdeskClientContext)

  return freshdeskClient
}
