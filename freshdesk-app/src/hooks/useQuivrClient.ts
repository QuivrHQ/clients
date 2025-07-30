import { useMemo } from 'react'
import { TemplateRequestService } from '../services/template-request'
import { useFreshdeskClient } from '../context/FreshdeskClientContext'
import type { HelpdeskAccount } from '../types/quivr'

export const useQuivrClient = () => {
  const client = useFreshdeskClient()
  const requestService = useMemo(() => new TemplateRequestService(client!), [client])

  return {
    getHelpdeskAccount: async () => {
      return requestService.invoke<HelpdeskAccount>({
        templateName: 'getHelpdeskAccount'
      })
    }
  }
}
