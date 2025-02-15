import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'
import React, { useEffect, useState } from 'react'
import { useClient } from './hooks/useClient'
import TextAreaInput from './shared/components/TextArea.tsx/TextAreaInput'

import styles from './App.module.scss'
import ResponseContainer from './components/ResponseContainer/ResponseContainer'
import { useZendesk } from './hooks/useZendesk'
import { QuivrService } from './services/quivr'
import { Icon } from './shared/components/Icon/Icon'
import QuivrButton from './shared/components/QuivrButton/QuivrButton'
import SplitButton from './shared/components/SplitButton/SplitButton'
import { correctPrompt, reformulationPrompt } from './shared/helpers/submitPrompts'
import { SplitButtonType } from './types/button'

function App() {
  const [agentPrompt, setAgentPrompt] = useState(
    'Vous êtes un assistant attentionné de LocService, et votre objectif est de satisfaire la demande du client.'
  )
  const [response, setResponse] = useState('')
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)
  const [loading, setLoading] = useState(false)
  const [alreadyReformulated, setAlreadyReformulated] = useState(false)
  const [editAgentPromptMode, setEditAgentPromptMode] = useState(false)
  const [promptSnippetHovered, setPromptSnippetHovered] = useState(false)

  const buttons: SplitButtonType[] = [
    {
      label: 'Generate',
      onClick: () => {
        generate()
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Rewrite',
      onClick: () => {
        reformulate()
      },
      iconName: 'chevronRight',
      disabled: loading
    },
    {
      label: 'Correct',
      onClick: () => {
        correct()
      },
      iconName: 'chevronRight',
      disabled: loading
    }
  ]

  const client = useClient()
  const { getHistoric, getUserInput, getRequesterName, getUserName, pasteInEditor } = useZendesk()

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '450px' })

    const initializeQuivrService = async () => {
      const service = new QuivrService('https://api.quivr.app', client)
      setQuivrService(service)
    }

    initializeQuivrService()
  }, [client])

  const correct = async () => {
    const userInput = await getUserInput(client)
    const prompt = correctPrompt(userInput)

    await submit(prompt)
  }

  async function generate() {
    const historic = await getHistoric(client)

    return submit(historic[historic.length - 1])
  }

  const reformulate = async () => {
    try {
      const historic = await getHistoric(client)
      const userInput = await getUserInput(client)

      const prompt = reformulationPrompt(alreadyReformulated, userInput, agentPrompt, historic)

      await submit(prompt)
      setAlreadyReformulated(true)
    } catch (error) {
      console.error('Error rewriting response:', error)
      setResponse('Error occurred while rewriting response.')
    } finally {
      setAlreadyReformulated(true)
    }
  }

  const submit = async (prompt: string) => {
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
      const result = await quivrService.getQuivrResponse(prompt, chatId)

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
        {editAgentPromptMode ? (
          <TextAreaInput
            label="Prompt"
            inputValue={agentPrompt}
            setInputValue={setAgentPrompt}
            onSubmit={() => setEditAgentPromptMode(false)}
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
        {response && (
          <>
            <div className={styles.response_separator}></div>
            <div className={styles.response_container}>
              <ResponseContainer responseContent={response}></ResponseContainer>
            </div>
            <div className={styles.response_separator}></div>
          </>
        )}
        <div className={styles.buttons_wrapper}>
          <QuivrButton
            label="Copy / Paste"
            color="black"
            onClick={() => pasteInEditor(client, response)}
            size="tiny"
            disabled={!response}
          />
          <SplitButton color="black" splitButtons={buttons} />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
