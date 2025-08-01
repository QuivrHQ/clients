import { useMemo } from 'react'
import { TemplateRequestService } from '../../services/template-request'
import { useFreshdeskClient } from '../../context/FreshdeskClientContext/FreshdeskClientContext'
import type { Autodraft, HelpdeskAccount } from '../../types/quivr'

export const useQuivrClient = () => {
  const client = useFreshdeskClient()
  const requestService = useMemo(() => new TemplateRequestService(client!), [client])

  return {
    getHelpdeskAccount: async () => {
      return requestService.invoke<HelpdeskAccount>({
        templateName: 'getHelpdeskAccount'
      })
    },
    getAutodraft: async (ticketId: string) => {
      return requestService.invoke<Autodraft>({
        templateName: 'getAutodraft',
        context: {
          ticket_id: ticketId
        }
      })
    }
  }
}
