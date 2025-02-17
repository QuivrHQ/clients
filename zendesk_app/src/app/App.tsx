import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'
import React, { useEffect, useState } from 'react'
import { useClient } from './hooks/useClient'
import TextAreaInput from './shared/components/TextArea.tsx/TextAreaInput'

import styles from './App.module.scss'
import IterationTextbox from './components/IterationTextbox/IterationTextbox'
import ResponseContainer from './components/ResponseContainer/ResponseContainer'
import { useZendesk } from './hooks/useZendesk'
import { QuivrService } from './services/quivr'
import { Icon } from './shared/components/Icon/Icon'
import QuivrButton from './shared/components/QuivrButton/QuivrButton'
import SplitButton from './shared/components/SplitButton/SplitButton'
import { SplitButtonType } from './types/button'
import { ZendeskTask } from './types/zendesk'

function App() {
  const [agentPrompt, setAgentPrompt] = useState(
    'Vous êtes un assistant attentionné de LocService, et votre objectif est de satisfaire la demande du client.'
  )
  const [response, setResponse] = useState('')
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [loading, setLoading] = useState(false)
  const [editAgentPromptMode, setEditAgentPromptMode] = useState(false)
  const [promptSnippetHovered, setPromptSnippetHovered] = useState(false)
  const [iterationRequest, setIterationRequest] = useState('')

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
      const service = new QuivrService('http://localhost:5050', client)
      setQuivrService(service)
    }

    initializeQuivrService()
  }, [client])

  useEffect(() => {
    if (quivrService) {
      setTimeout(async () => {
        quivrService.getZendeskConnection().then((response) => {
          console.log(response)
        })
      })
    }
  }, [quivrService])

  const createZendeskConnection = async () => {
    await quivrService.createZendeskConnection()
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

      const result = await quivrService.executeZendeskTask(task, chatId, agentPrompt, ticketId, userInput)

      setResponse(result.replace(/\\n/g, '\n').replace(/\n/g, '<br>'))
    } catch (error) {
      console.error('Error rewriting response:', error)
      setResponse('Error occurred while rewriting response.')
    } finally {
      clearInterval(loadingInterval)
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      <div className={styles.content_container}>
        <div className={styles.top_container}>
          {editAgentPromptMode ? (
            <TextAreaInput
              label="Prompt"
              inputValue={agentPrompt}
              setInputValue={setAgentPrompt}
              onSubmit={() => {
                setEditAgentPromptMode(false)
                setPromptSnippetHovered(false)
              }}
              autoFocus={true}
            />
          ) : (
            <div
              className={styles.prompt_snippet}
              onClick={() => setEditAgentPromptMode(true)}
              onMouseOver={() => setPromptSnippetHovered(true)}
              onMouseOut={() => setPromptSnippetHovered(false)}
            >
              <span className={styles.prompt}>{agentPrompt}</span>
              <Icon name="edit" size="normal" color={promptSnippetHovered ? 'primary' : 'black'} />
            </div>
          )}
          <div className={styles.buttons_wrapper}>
            <QuivrButton
              label="Copy Draft"
              color="black"
              onClick={() => pasteInEditor(client, response)}
              size="tiny"
              disabled={!response}
            />
            <SplitButton color="black" splitButtons={buttons} />
          </div>
          {response && (
            <>
              <div className={styles.response_separator}></div>
              <div className={styles.response_container}>
                <ResponseContainer responseContent={response}></ResponseContainer>
              </div>
              <div className={styles.response_separator}></div>
            </>
          )}
        </div>
        {!!response && (
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
