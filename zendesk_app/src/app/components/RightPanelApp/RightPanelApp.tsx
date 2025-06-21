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
import { Autodraft, ZendeskTask } from '../../types/zendesk'
import { IterationTextbox } from './components/IterationTextbox/IterationTextbox'
import { ResponseContainer } from './components/ResponseContainer/ResponseContainer'

import { marked } from 'marked'
import { useExecuteZendeskTaskContext } from '../../contexts/ExecuteZendeskTaskProvider'
import { ZAFClient } from '../../contexts/ClientProvider'
import { normalizeNewlinesToHtml } from '../../shared/helpers/html'
import styles from './RightPanelApp.module.scss'
import { copyDraftSource, trackingEvents } from '@constants/tracking-events'
import posthog from 'posthog-js'

export const RightPanelApp = (): JSX.Element => {
  const { quivrService, ingestionStatus, setIngestionStatus, zendeskConnection } = useQuivrApiContext()
  const [iterationRequest, setIterationRequest] = useState('')
  const { actionButtons, isChatEnabled } = useActionButtons()
  const { loading, response, setResponse, submitTask, ticketAnswerId, setTicketAnswerId, isError } =
    useExecuteZendeskTaskContext()
  const [ongoingTask, setOngoingTask] = useState(false)
  const [autoDraft, setAutoDraft] = useState<Autodraft | null>(null)
  const { pasteInEditor, getTicketId, getUser } = useZendesk()
  const client = useClient() as ZAFClient

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '450px' })
  }, [client])

  useEffect(() => {
    const getAutoDraft = async () => {
      if (quivrService && zendeskConnection?.brain_links.some((link) => link.auto_draft_front)) {
        const ticketId = await getTicketId(client)
        const autoDraft = await quivrService.getAutoDraft(ticketId)
        if (autoDraft?.generated_answer) {
          setResponse(autoDraft.generated_answer)
          setTicketAnswerId(autoDraft.ticket_answer_id)
          setAutoDraft(autoDraft)
        }
      }
    }

    getAutoDraft()
  }, [quivrService, zendeskConnection?.brain_links])

  const isLoadingText = (): boolean => {
    return ['.', '..', '...'].includes(response)
  }

  const onCopyDraft = async () => {
    await pasteInEditor(client, await marked(normalizeNewlinesToHtml(response)))

    if (ticketAnswerId) {
      const user = await getUser(client)
      await quivrService?.updateTicketAnswer(ticketAnswerId, {
        accepted: true,
        support_agent: {
          name: user.name,
          email: user.email,
          role: user.role,
          platform_user_id: user.id
        }
      })
    }
  }

  const handleSubmitTask = async (action: ZendeskTask) => {
    setOngoingTask(true)
    await submitTask(action, { iterationRequest })
    setOngoingTask(false)
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
            onClick={() => {
              posthog.capture(trackingEvents.COPY_DRAFT, {
                autosendable: autoDraft?.prediction?.is_autosendable,
                source: copyDraftSource.BUTTON
              })
              onCopyDraft()
            }}
            size="tiny"
            disabled={isLoadingText() || !response}
          />
          <SplitButton color="black" splitButtons={actionButtons} disabled={loading} onSubmit={handleSubmitTask} />
        </div>
        {response && (
          <>
            {isError && (
              <MessageInfoBox type="warning">
                <span className={styles.error}>
                  An error has occurred and may interfere with the generation of a relevant response.
                </span>
              </MessageInfoBox>
            )}
            <div className={styles.response_separator}></div>
            <div className={styles.response_container}>
              <ResponseContainer
                responseContent={response}
                autoDraft={autoDraft}
                onCopyDraft={onCopyDraft}
                setResponseContent={setResponse}
                ongoingTask={ongoingTask}
                ticketAnswerId={ticketAnswerId}
              ></ResponseContainer>
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
            onSubmit={() => void handleSubmitTask('iterate')} // Utilise la nouvelle fonction
            hasDraftResponse={!!response}
            ongoingTask={ongoingTask}
          ></IterationTextbox>
        </div>
      )}
    </div>
  )
}

export default RightPanelApp
