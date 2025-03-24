import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { useClient } from '../../hooks/useClient'
import { useZendesk } from '../../hooks/useZendesk'
import { QuivrService } from '../../services/quivr'
import { SplitButtonType } from '../../types/button'
import { ZendeskTask } from '../../types/zendesk'

import { LoaderIcon } from '../../shared/components/LoaderIcon/LoaderIcon'
import ActionButton from './ActionButton/ActionButton'
import styles from './ReplyBoxApp.module.scss'

const ACTION_BUTTON_HEIGHT = 34

export const ReplyBoxApp = (): JSX.Element => {
  const client = useClient()
  const agentPrompt: string =
    'Vous êtes un assistant attentionné,  votre objectif est de satisfaire la demande du client.'
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')

  const buttons: SplitButtonType[] = [
    {
      label: 'Generate Draft',
      onClick: () => {
        submit('generate')
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Rewrite Reply',
      onClick: () => {
        submit('reformulate')
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Correct Reply',
      onClick: () => {
        submit('correct')
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Summarize Ticket',
      onClick: () => {
        submit('summarize')
      },
      iconName: 'chevronRight',
      disabled: loading
    }
  ]

  const { getTicketId, getUserInput } = useZendesk()

  useEffect(() => {
    client.invoke('resize', { width: '200px', height: `${ACTION_BUTTON_HEIGHT * buttons.length + 28}px` })

    const initializeQuivrService = async () => {
      const service = new QuivrService('https://api.quivr.app', client)
      setQuivrService(service)
    }

    initializeQuivrService()
  }, [client])

  useEffect(() => {
    if (response && response !== '.' && response !== '..' && response !== '...') {
      client.set('ticket.comment.text', marked(response.replace(/<br>/g, '\n')))
    }
  }, [response, client])

  const submit = async (task: ZendeskTask) => {
    if (!quivrService) return

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

      await quivrService.executeZendeskTask(
        task,
        chatId,
        agentPrompt,
        ticketId,
        task === 'iterate' ? response : userInput,
        (message: string) => {
          if (!!message.length) {
            clearInterval(loadingInterval)
            setLoading(false)
            client.invoke('close')
            setResponse((prevResponse) =>
              prevResponse === '.' || prevResponse === '..' || prevResponse === '...'
                ? message.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
                : prevResponse + message.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
            )
          }
        }
      )
    } catch (error) {
      console.error(error)
      setResponse('Error occurred while rewriting response.')
    } finally {
      clearInterval(loadingInterval)
    }
  }

  return (
    <div className={`${styles.content_container} ${loading ? styles.loading : ''}`}>
      {!loading ? (
        <div className={styles.loading_box}>
          <span>Loading...</span>
          <LoaderIcon size="big" color="black" />
        </div>
      ) : (
        <div className={styles.buttons_container}>
          {buttons.map((button, index) => (
            <div key={index}>
              <ActionButton button={button} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReplyBoxApp
