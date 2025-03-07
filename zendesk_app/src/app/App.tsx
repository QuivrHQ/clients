import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'
import { marked } from 'marked'
import React, { useEffect, useState } from 'react'
import { useClient } from './hooks/useClient'

import styles from './App.module.scss'
import IterationTextbox from './components/IterationTextbox/IterationTextbox'
import ResponseContainer from './components/ResponseContainer/ResponseContainer'
import { useZendesk } from './hooks/useZendesk'
import { QuivrService } from './services/quivr'
import { Icon } from './shared/components/Icon/Icon'
import { MessageInfoBox } from './shared/components/MessageInfoBox/MessageInfoBox'
import ProgressBar from './shared/components/ProgressBar/ProgressBar'
import { QuivrButton } from './shared/components/QuivrButton/QuivrButton'
import { SplitButton } from './shared/components/SplitButton/SplitButton'
import { SplitButtonType } from './types/button'
import { TicketIngestionProgress, ZendeskTask } from './types/zendesk'

function App() {
  const [agentPrompt, setAgentPrompt] = useState(
    'Vous êtes un assistant attentionné,  votre objectif est de satisfaire la demande du client.'
  )
  const [response, setResponse] = useState('')
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [loading, setLoading] = useState(false)
  const [iterationRequest, setIterationRequest] = useState('')
  const [accountConnected, setAccountConnected] = useState(false)
  const [ingestionStatus, setIngestionStatus] = useState<TicketIngestionProgress | null>(null)

  const buttons: SplitButtonType[] = [
    {
      label: 'Generate',
      onClick: () => {
        submit('generate')
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Rewrite',
      onClick: () => {
        submit('reformulate')
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Correct',
      onClick: () => {
        submit('correct')
      },
      iconName: 'chevronRight',
      disabled: loading
    }
  ]

  const client = useClient()
  const { getUserInput, pasteInEditor, getTicketId, getSubdomain, getUserEmail } = useZendesk()

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

    connectZendeskAccount()
  }, [quivrService])

  const isLoadingText = (): boolean => {
    return ['.', '..', '...'].includes(response)
  }

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

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
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
    </ThemeProvider>
  )
}

export default App
