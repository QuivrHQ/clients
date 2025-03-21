import React, { useEffect, useState, type JSX } from 'react'
import { useClient } from '../../hooks/useClient'
import { useZendesk } from '../../hooks/useZendesk'
import { QuivrService } from '../../services/quivr'
import { Icon } from '../../shared/components/Icon/Icon'
import { MessageInfoBox } from '../../shared/components/MessageInfoBox/MessageInfoBox'
import { ProgressBar } from '../../shared/components/ProgressBar/ProgressBar'
import { QuivrButton } from '../../shared/components/QuivrButton/QuivrButton'
import { SplitButton } from '../../shared/components/SplitButton/SplitButton'
import { SplitButtonType } from '../../types/button'
import { TicketIngestionProgress, ZendeskTask } from '../../types/zendesk'
import { IterationTextbox } from './components/IterationTextbox/IterationTextbox'
import { ResponseContainer } from './components/ResponseContainer/ResponseContainer'

import { marked } from 'marked'
import styles from './RightPanelApp.module.scss'

export const RightPanelApp = (): JSX.Element => {
  const agentPrompt: string =
    'Vous êtes un assistant attentionné,  votre objectif est de satisfaire la demande du client.'
  const [response, setResponse] = useState('')
  const [ingestionStatus, setIngestionStatus] = useState<TicketIngestionProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [iterationRequest, setIterationRequest] = useState('')
  const [accountConnected, setAccountConnected] = useState(false)

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

  const { pasteInEditor, getTicketId, getUserInput, getSubdomain, getUserEmail } = useZendesk()
  const client = useClient()

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '450px' })

    const initializeQuivrService = async () => {
      const service = new QuivrService('https://api.quivr.app', client)
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
            if (response === null) {
              quivrService.createZendeskConnection(subdomain, userEmail).then(async (response: string) => {
                const intervalId = setInterval(async () => {
                  const res: TicketIngestionProgress = await quivrService.getWorkflowStatus(response)
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

    const getAutoDraft = async () => {
      if (quivrService) {
        const ticketId = await getTicketId(client)
        const autoDraft = await quivrService.getAutoDraft(ticketId)
        setResponse(autoDraft)
      }
    }

    connectZendeskAccount()
    getAutoDraft()
  }, [quivrService])

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
        task === 'iterate' ? iterationRequest : agentPrompt,
        ticketId,
        task === 'iterate' ? response : userInput,
        (message: string) => {
          if (!!message.length) {
            clearInterval(loadingInterval)
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
      setLoading(false)
    }
  }

  const isLoadingText = (): boolean => {
    return ['.', '..', '...'].includes(response)
  }

  return (
    <div className={styles.content_container}>
      <div className={`${styles.top_container} ${!response ? styles.without_response : ''}`}>
        {ingestionStatus && (
          <MessageInfoBox type="info" children={undefined}>
            <div className={styles.ingestion_progress}>
              <div className={styles.close}>
                <Icon
                  name="close"
                  size="normal"
                  color="black"
                  handleHover={true}
                  onClick={() => setIngestionStatus(null)}
                />
              </div>
              <span>We are currently ingesting your tickets to generate relevant responses.</span>
              <ProgressBar total={ingestionStatus.total_tickets} processed={ingestionStatus.processed_tickets} />
            </div>
          </MessageInfoBox>
        )}

        <div className={styles.buttons_wrapper}>
          <QuivrButton
            label="Copy Draft"
            color="black"
            onClick={() => pasteInEditor(client, marked(response))}
            size="tiny"
            disabled={isLoadingText() || !response}
          />
          <SplitButton color="black" splitButtons={buttons} />
        </div>
        {response && (
          <>
            <div className={styles.response_separator}></div>
            <div className={styles.response_container}>
              <ResponseContainer responseContent={response} setResponseContent={setResponse}></ResponseContainer>
            </div>
            <div className={styles.response_separator}></div>
          </>
        )}
      </div>
      {!!response && !isLoadingText() && (
        <div className={styles.test}>
          <IterationTextbox
            value={iterationRequest}
            setValue={setIterationRequest}
            onSubmit={() => void submit('iterate')}
          ></IterationTextbox>
        </div>
      )}
    </div>
  )
}

export default RightPanelApp
