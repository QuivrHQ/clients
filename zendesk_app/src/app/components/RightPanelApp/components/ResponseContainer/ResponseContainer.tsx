import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../../../contexts/ClientProvider'
import { useExecuteZendeskTaskContext } from '../../../../contexts/ExecuteZendeskTaskProvider'
import { useClient } from '../../../../hooks/useClient'
import { useQuivrApiContext } from '../../../../hooks/useQuivrApiContext'
import { useZendesk } from '../../../../hooks/useZendesk'
import { Icon } from '../../../../shared/components/Icon/Icon'
import Tooltip from '../../../../shared/components/Tooltip/Tooltip'
import { normalizeNewlinesToHtml } from '../../../../shared/helpers/html'
import { Autodraft } from '../../../../types/zendesk'
import styles from './ResponseContainer.module.scss'

const subdomainsEligibleToAutosend = ['getquivr', 'd3v-quivr', 'trusk']

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
  ongoingTask: boolean
  autoDraft: Autodraft | null
  onCopyDraft: () => Promise<void>
  ticketAnswerId?: string
}

export const ResponseContainer = ({
  responseContent,
  setResponseContent,
  ongoingTask,
  autoDraft,
  onCopyDraft,
  ticketAnswerId
}: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const client = useClient() as ZAFClient
  const { setIsError } = useExecuteZendeskTaskContext()
  const { sendMessage, getLatestEndUserMessage, getSubdomain, pasteInEditor } = useZendesk()
  const { quivrService } = useQuivrApiContext()
  const [isAutosendableFeedbackOpen, setIsAutosendableFeedbackOpen] = useState(true)
  const [feedbackModalViewed, setFeedbackModalViewed] = useState(false)

  useEffect(() => {
    if (!manualEditing) {
      const parseMarkdown = async () => {
        const html = await marked(normalizeNewlinesToHtml(responseContent))
        setHtmlContent(html)
      }
      void parseMarkdown()
    }
  }, [responseContent])

  useEffect(() => {
    if (ongoingTask) {
      setIsError(false)
      setIsAutosendableFeedbackOpen(false)
    }
    if (!ongoingTask) {
      setRating(0)
    }
  }, [ongoingTask])

  useEffect(() => {
    const checkAutosendModal = async () => {
      const subdomain = await getSubdomain(client)
      if (
        autoDraft?.prediction?.is_autosendable &&
        autoDraft?.prediction?.is_accepted === null &&
        htmlContent !== '' &&
        subdomainsEligibleToAutosend.includes(subdomain) &&
        !feedbackModalViewed
      ) {
        setFeedbackModalViewed(true)
        openFeedbackModal({ autosendable: true, askForFeedback: true })
      }
    }
    void checkAutosendModal()
  }, [autoDraft, htmlContent, client, feedbackModalViewed])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (autoDraft?.prediction?.is_autosendable) {
      return
    }

    setManualEditing(true)
    setResponseContent(event.currentTarget.innerHTML)
  }

  const handleStarClick = async (value: number) => {
    setRating(value)

    if (!ticketAnswerId) return

    try {
      await quivrService?.updateTicketAnswer(ticketAnswerId, {
        support_agent_rating_score: value
      })
    } catch (error) {
      console.error('Error rating generated answer', error)
    }
  }

  const openFeedbackModal = async ({
    autosendable = false,
    askForFeedback = false
  }: {
    autosendable?: boolean
    askForFeedback?: boolean
  }) => {
    let latestEndUserMessage = null
    try {
      latestEndUserMessage = autosendable ? await getLatestEndUserMessage(client) : null
    } catch (error) {
      console.error('Error getting latest end user message', error);
      return;
    }

    client
      .invoke('instances.create', {
        location: 'modal',
        url: import.meta.env.VITE_ZENDESK_MODAL_LOCATION,
        size: {
          width: askForFeedback ? '600px' : '280px',
          height: autosendable ? (askForFeedback ? '500px' : '150px') : '300px'
        }
      })
      .then(async (modalContext) => {
        const modalGuid = modalContext['instances.create'][0].instanceGuid
        const modalClient = client.instance(modalGuid)

        if (autosendable) {
          modalClient.on('modal.ready', function () {
            modalClient.trigger('modal.data_autosend', {
              ticketAnswerId: autoDraft?.ticket_answer_id,
              predictionId: autoDraft?.prediction?.prediction_id,
              askForFeedback: askForFeedback,
              response: htmlContent,
              endUserMessage: latestEndUserMessage
            })
          })

          modalClient.on('modal.copy_draft', function () {
            setIsAutosendableFeedbackOpen(false)
            void onCopyDraft()
          })

          modalClient.on('modal.send_draft', async function () {
            setIsAutosendableFeedbackOpen(false)
            if (autoDraft?.generated_answer) {
              await sendMessage(client, autoDraft?.generated_answer)
              await pasteInEditor(client, "")
            }
          })

          modalClient.on('modal.reject_draft', function () {
            setIsAutosendableFeedbackOpen(false)
          })
        } else {
          modalClient.on('modal.ready', function () {
            modalClient.trigger('modal.data', {
              ticketAnswerId: ticketAnswerId,
              rating: rating
            })
          })
        }
      })
  }

  const approveDraftResponse = () => {
    openFeedbackModal({ autosendable: true })
  }

  const rejectDraftResponse = async () => {
    if (!autoDraft?.prediction?.prediction_id || !autoDraft?.ticket_answer_id) return

    try {
      await quivrService?.updatePredictionAcceptance(
        autoDraft.prediction.prediction_id,
        autoDraft.ticket_answer_id,
        false
      )
    } catch (error) {
      console.error('Error sending prediction acceptance', error)
    } finally {
      setIsAutosendableFeedbackOpen(false)
    }
  }

  return (
    <div className={styles.main_container}>
      <div
        className={`${styles.response_container} ${autoDraft?.prediction?.is_autosendable ? styles.autosendable : ''}`}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleInput}
        onBlur={() => setManualEditing(false)}
      ></div>
      {!ongoingTask && (
        <>
          {autoDraft?.prediction?.is_autosendable &&
          autoDraft?.prediction?.is_accepted === null &&
          isAutosendableFeedbackOpen ? (
            <div className={styles.feedback_wrapper}>
              <div className={styles.autosend_container}>
                <Tooltip
                  side="bottom"
                  tooltip="This response has been marked as ready to send. Confirm if you agree. Your feedback helps us improve our AI"
                >
                  <p>Is this answer sendable?</p>
                </Tooltip>
                <div className={styles.autosend_buttons_container}>
                  <button className={styles.autosend_button} onClick={approveDraftResponse}>
                    <Icon name="check" color="success" size="normal" />
                  </button>
                  <button className={styles.autosend_button} onClick={rejectDraftResponse}>
                    <Icon name="close" color="dangerous" size="normal" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.feedback_wrapper}>
              <div className={styles.stars_container}>
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1
                  return (
                    <span
                      key={starValue}
                      className={`${styles.star} ${starValue <= rating ? styles.filled : ''}`}
                      onClick={() => handleStarClick(starValue)}
                    >
                      ★
                    </span>
                  )
                })}
              </div>
              <span className={styles.feedback_button} onClick={() => openFeedbackModal({ autosendable: false })}>
                - Add details
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResponseContainer
