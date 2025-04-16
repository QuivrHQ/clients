import { useEffect, useState, type JSX } from 'react'
import { useActionButtons } from '../../hooks/useActionButtons'
import { useClient } from '../../hooks/useClient'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import { useZendesk } from '../../hooks/useZendesk'
import { Icon } from '../../shared/components/Icon/Icon'
import { MessageInfoBox } from '../../shared/components/MessageInfoBox/MessageInfoBox'
import { ProgressBar } from '../../shared/components/ProgressBar/ProgressBar'
import { QuivrButton } from '../../shared/components/QuivrButton/QuivrButton'
import { SplitButton } from '../../shared/components/SplitButton/SplitButton'
import { ZendeskTask } from '../../types/zendesk'
import { IterationTextbox } from './components/IterationTextbox/IterationTextbox'
import { ResponseContainer } from './components/ResponseContainer/ResponseContainer'

import { marked } from 'marked'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useExecuteZendeskTask } from '../../hooks/useExecuteZendeskTask'
import styles from './RightPanelApp.module.scss'

export const RightPanelApp = (): JSX.Element => {
  const { quivrService, ingestionStatus, setIngestionStatus } = useQuivrApiContext()
  const [iterationRequest, setIterationRequest] = useState('')
  const { actionButtons, isChatEnabled } = useActionButtons()
  const { loading, response, setResponse, submitTask } = useExecuteZendeskTask()

  const { pasteInEditor, getTicketId, getAssignee } = useZendesk()
  const client = useClient() as ZAFClient

  const updateSupportAgentWithAssignee = async (ticketId: string) => {
    const assignee = await getAssignee(client);
    if(assignee) {
      await quivrService?.updateSupportAgent(ticketId, assignee)
    }
  }

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '450px' })
  }, [client])

  useEffect(() => {
    const getAutoDraft = async () => {
      if (quivrService) {
        const ticketId = await getTicketId(client)
        const autoDraft = await quivrService.getAutoDraft(ticketId)

        if(autoDraft) {
          updateSupportAgentWithAssignee(ticketId)
          setResponse(autoDraft)

          client.on('ticket.assignee.user.id.changed', (assigneeId: string) => {
            if(assigneeId) {
              updateSupportAgentWithAssignee(ticketId)
            }
          })
        }
      }
    }

    getAutoDraft()
  }, [quivrService])

  const isLoadingText = (): boolean => {
    return ['.', '..', '...'].includes(response)
  }

  const onCopyDraft = async () => {
    await pasteInEditor(client, await marked(response))

    const ticketId = await getTicketId(client)
    await quivrService?.acceptTicketAnswer(ticketId)
  }

  return (
    <div className={styles.content_container}>
      <div className={`${styles.top_container} ${!response ? styles.without_response : ''}`}>
        {ingestionStatus && (
          <MessageInfoBox type="info">
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
            onClick={onCopyDraft}
            size="tiny"
            disabled={isLoadingText() || !response}
          />
          <SplitButton
            color="black"
            splitButtons={actionButtons}
            disabled={loading}
            onSubmit={(action: ZendeskTask) => submitTask(action, { iterationRequest })}
          />
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
      {isChatEnabled && (
        <div className={styles.test}>
          <IterationTextbox
            value={iterationRequest}
            setValue={setIterationRequest}
            onSubmit={() => void submitTask('iterate', { iterationRequest })}
            hasDraftResponse={!!response}
          ></IterationTextbox>
        </div>
      )}
    </div>
  )
}

export default RightPanelApp
