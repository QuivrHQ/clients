import { createContext, ReactNode, useContext, useState } from 'react'
import { useClient } from '../hooks/useClient'
import { useQuivrApiContext } from '../hooks/useQuivrApiContext'
import { useZendesk } from '../hooks/useZendesk'
import { ZendeskTask } from '../types/zendesk'
import { ZAFClient } from './ClientProvider'
import * as Sentry from '@sentry/react'

const agentPrompt = 'Vous êtes un assistant attentionné,  votre objectif est de satisfaire la demande du client.'

interface ExecuteZendeskTaskContextProps {
  loading: boolean
  response: string
  isAutoDraftDisplayed: boolean
  setResponse: (r: string) => void
  submitTask: (task: ZendeskTask, options: { iterationRequest?: string; onFinish?: () => void }) => Promise<void>
  ticketAnswerId?: string
  setTicketAnswerId: (id?: string) => void
  isError: boolean
  setIsError: (b: boolean) => void
}

export const ExecuteZendeskTaskContext = createContext<ExecuteZendeskTaskContextProps | undefined>(undefined)

const shouldGenerateNewChatId = (previousTask: ZendeskTask | undefined) => {
  return !(previousTask === 'iterate' || previousTask === 'reformulate')
}

export const ExecuteZendeskTaskProvider = ({ children }: { children: ReactNode }) => {
  const { quivrService } = useQuivrApiContext()
  const { getTicketId, getUserInput, getUser } = useZendesk()
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [isError, setIsError] = useState<boolean>(false)
  const [ticketAnswerId, setTicketAnswerId] = useState<string | undefined>(undefined)
  const [previousTask, setPreviousTask] = useState<{ task: ZendeskTask; chatId: string } | null>(null)
  const client = useClient() as ZAFClient

  const submitTask = async (task: ZendeskTask, options: { iterationRequest?: string; onFinish?: () => void }) => {
    if (!quivrService) return
    const { iterationRequest, onFinish } = options

    setLoading(true)
    let loadingText = '.'
    setResponse(loadingText)
    setTicketAnswerId(undefined)
    const loadingInterval = setInterval(() => {
      loadingText = loadingText.length < 3 ? loadingText + '.' : '.'
      setResponse(loadingText)
    }, 300)

    try {
      let chatId = previousTask?.chatId
      if (!chatId || shouldGenerateNewChatId(previousTask?.task)) {
        chatId = await quivrService.getNewChatId('Zendesk Chat')
      }
      const ticketId = await getTicketId(client)
      const userInput = await getUserInput(client)
      const user = await getUser(client)

      await quivrService.executeZendeskTaskV2(
        task,
        chatId,
        task === 'iterate' && iterationRequest ? iterationRequest : agentPrompt,
        ticketId,
        task === 'iterate' ? response : userInput,
        user,
        (message: string, ticketAnswerId?: string) => {
          if (ticketAnswerId) {
            setTicketAnswerId(ticketAnswerId)
          }

          if (message.length) {
            clearInterval(loadingInterval)
            setLoading(false)
            onFinish?.()
            setResponse((prevResponse: string) =>
              ['.', '..', '...'].includes(prevResponse) ? message : prevResponse + message
            )
          }
        },
        (error: string | null) => {
          setIsError(error !== null)
        }
      )
      setPreviousTask({ task, chatId })
    } catch (error) {
      console.error('An error occurred while generating response.', error)
      Sentry.logger.trace(Sentry.logger.fmt`An error occurred while generating response: '${error}'`)

      setResponse('Error occurred while generating response.')
    } finally {
      clearInterval(loadingInterval)
      setLoading(false)
      onFinish?.()
    }
  }

  return (
    <ExecuteZendeskTaskContext.Provider
      value={{
        loading,
        response,
        setResponse,
        isAutoDraftDisplayed: !Boolean(previousTask),
        submitTask,
        ticketAnswerId,
        setTicketAnswerId,
        isError,
        setIsError
      }}
    >
      {children}
    </ExecuteZendeskTaskContext.Provider>
  )
}

export const useExecuteZendeskTaskContext = () => {
  const context = useContext(ExecuteZendeskTaskContext)
  if (!context) {
    throw new Error('useExecuteZendeskTaskContext must be used within an ExecuteZendeskTaskProvider')
  }
  return context
}
