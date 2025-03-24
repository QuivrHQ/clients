import React, { createContext, useEffect, useMemo, useState } from 'react'

declare global {
  interface Window {
    ZAFClient: {
      init(): ZAFClient
    }
  }
}

export interface ZAFClient {
  invoke: (command: string, ...args: any[]) => Promise<any>
  get: (path: string) => Promise<any>
  set: (path: string, value: any) => Promise<any>
  on: (event: string, callback: (data: any) => void) => void
  trigger: (event: string, data?: any) => void
}

export const ClientContext = createContext({})

export function ClientProvider({ children }) {
  const client: ZAFClient = useMemo(() => window.ZAFClient.init(), [])
  const [appRegistered, setAppRegistered] = useState(false)

  useEffect(() => {
    client.on('app.registered', function () {
      setAppRegistered(true)
    })
  }, [client])

  if (!appRegistered) return null

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
