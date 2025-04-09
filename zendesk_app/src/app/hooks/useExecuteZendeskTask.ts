import { useState } from 'react'
import { ZendeskTask } from '../types/zendesk'
import { useQuivrApiContext } from './useQuivrApiContext'
import { useZendesk } from './useZendesk'
import { ZAFClient } from '../contexts/ClientProvider'
import { useClient } from './useClient'

const agentPrompt = 'Vous êtes un assistant attentionné,  votre objectif est de satisfaire la demande du client.'

export const useExecuteZendeskTask = () => {
  const { quivrService } = useQuivrApiContext()
  const { getTicketId, getUserInput, getUser } = useZendesk()
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const client = useClient() as ZAFClient

  const submitTask = async (task: ZendeskTask, options: { iterationRequest?: string; onFinish?: () => void }) => {    
    if (!quivrService) return
    const { iterationRequest, onFinish } = options

    setLoading(true)
    let loadingText = '.'
    setResponse(loadingText)
    const loadingInterval = setInterval(() => {
      loadingText = loadingText.length < 3 ? loadingText + '.' : '.'
      setResponse(loadingText)
    }, 300)

    try {
      const chatId = await quivrService.getNewChatId('Zendesk Chat')
      const ticketId = await getTicketId(client)
      const userInput = await getUserInput(client)
      const user = await getUser(client)

      await quivrService.executeZendeskTask(
        task,
        chatId,
        task === 'iterate' && iterationRequest ? iterationRequest : agentPrompt,
        ticketId,
        task === 'iterate' ? response : userInput,
        user,
        (message: string) => {
          if (message.length) {
            clearInterval(loadingInterval)
            setLoading(false)
            onFinish?.()
            setResponse((prevResponse: string) =>
              ['.', '..', '...'].includes(prevResponse)
                ? message.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
                : prevResponse + message.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
            )
          }
        }
      )
    } catch (error) {
      console.error(error)
      setResponse('Error occurred while generating response.')
    } finally {
      clearInterval(loadingInterval)
      setLoading(false)
      onFinish?.()
    }
  }

  return { loading, response, setResponse, submitTask }
}
