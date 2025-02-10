import React, { createContext, useEffect, useMemo, useState } from 'react'

declare global {
  interface Window {
    ZAFClient: any
  }
}
export const ClientContext = createContext({})

export function ClientProvider({ children }) {
  const client = useMemo(() => window.ZAFClient.init(), [])
  const [appRegistered, setAppRegistered] = useState(false)

  useEffect(() => {
    client.on('app.registered', function () {
      setAppRegistered(true)
    })
  }, [client])

  if (!appRegistered) return null

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
