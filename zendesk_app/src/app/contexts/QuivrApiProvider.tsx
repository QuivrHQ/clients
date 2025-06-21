import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { QuivrService } from '../services/quivr'
import { ZAFClient } from '../contexts/ClientProvider'
import { TicketIngestionProgress, ZendeskConnection } from '../types/zendesk'
import { useClient } from '../hooks/useClient'
import { useZendesk } from '../hooks/useZendesk'

interface QuivrApiContextType {
  quivrService: QuivrService | null
  zendeskConnection: ZendeskConnection | null
  ingestionStatus: TicketIngestionProgress | null
  setIngestionStatus: React.Dispatch<React.SetStateAction<TicketIngestionProgress | null>>
}

export const QuivrApiContext = createContext<QuivrApiContextType | undefined>(undefined)

interface ProviderProps {
  children: ReactNode
}

export const QuivrApiProvider = ({ children }: ProviderProps) => {
  const client = useClient() as ZAFClient
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [accountConnected, setAccountConnected] = useState(false)
  const [ingestionStatus, setIngestionStatus] = useState<TicketIngestionProgress | null>(null)
  const { getSubdomain, getUserEmail } = useZendesk()
  const [zendeskConnection, setZendeskConnection] = useState<ZendeskConnection | null>(null)

  useEffect(() => {
    const initializeQuivrService = async () => {
      const service = new QuivrService(import.meta.env.VITE_QUIVR_API_URL, client)
      setQuivrService(service)
    }

    initializeQuivrService()
  }, [client])

  useEffect(() => {
    const connectZendeskAccount = async () => {
      if (quivrService && !accountConnected) {
        setAccountConnected(true)
        const subdomain = await getSubdomain(client)
        const userEmail = await getUserEmail(client)
        const timeoutId = setTimeout(async () => {
          quivrService.getZendeskConnection().then((response) => {
            setZendeskConnection(response)
            if (response === null) {
              quivrService.createZendeskConnection(subdomain, userEmail).then(async (connectionId: string) => {
                const intervalId = setInterval(async () => {
                  const res: TicketIngestionProgress = await quivrService.getWorkflowStatus(connectionId)
                  setIngestionStatus(res)
                  if (res.status === 'COMPLETED') {
                    clearInterval(intervalId)
                  }
                }, 1500)

                return () => clearInterval(intervalId)
              })
            }
          })
        })
        return () => clearTimeout(timeoutId)
      }
    }

    connectZendeskAccount()
  }, [quivrService, accountConnected, client, getSubdomain, getUserEmail])

  return (
    <QuivrApiContext.Provider value={{ quivrService, zendeskConnection, ingestionStatus, setIngestionStatus }}>
      {children}
    </QuivrApiContext.Provider>
  )
}
