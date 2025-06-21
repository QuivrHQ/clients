import posthog from 'posthog-js/'
import { createContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useZendesk } from '../hooks/useZendesk'

declare global {
  interface Window {
    ZAFClient: {
      init(): ZAFClient
    }
  }
}

interface Context {
  location?: string
  [key: string]: any
}

interface Metadata {
  [key: string]: any
}

export interface ZAFClient {
  on(event: string, callback: (data: any) => void, context?: any): void
  off(event: string, callback: (data: any) => void): void
  has(event: string, callback: (data: any) => void): boolean
  trigger(event: string, data?: any): void
  get<T = any>(key: string | string[]): Promise<T>
  set(key: string | { [key: string]: any }, value?: any, options?: { html?: boolean }): Promise<any>
  invoke<T = any>(method: string, ...args: any[]): Promise<T>
  metadata(): Promise<Metadata>
  context(): Promise<Context>
  instance(instanceGuid: string): ZAFClient
  request<T = any>(options: {
    url: string
    type: string
    contentType?: string
    data?: string
    [key: string]: any
  }): Promise<T>
}

export const ClientContext = createContext({})

export function ClientProvider({ children }: { children: ReactNode }) {
  const client: ZAFClient = useMemo(() => window.ZAFClient.init(), [])
  const { getSubdomain, getUser } = useZendesk()

  const [appRegistered, setAppRegistered] = useState(false)

  useEffect(() => {
    client.on('app.registered', async function () {
      setAppRegistered(true)
      const subdomain = await getSubdomain(client)
      const user = await getUser(client)
      posthog.identify(user.id.toString(), { subdomain, email: user.email })
    })
  }, [client])

  if (!appRegistered) return null

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
