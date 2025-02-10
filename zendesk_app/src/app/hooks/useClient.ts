import { useContext } from 'react'
import { ClientContext } from '../contexts/ClientProvider'

export const useClient = () => {
  const ctx = useContext(ClientContext)

  if (!ctx) {
    throw new Error('useClient must be used within a ClientProvider')
  }

  return ctx
}
