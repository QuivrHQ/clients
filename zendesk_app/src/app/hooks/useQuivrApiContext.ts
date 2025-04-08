import { useContext } from 'react'
import { QuivrApiContext } from '../contexts/QuivrApiProvider'

export const useQuivrApiContext = () => {
  const context = useContext(QuivrApiContext)
  if (!context) {
    throw new Error('useQuivrServiceContext must be used within a QuivrServiceProvider')
  }
  return context
}
