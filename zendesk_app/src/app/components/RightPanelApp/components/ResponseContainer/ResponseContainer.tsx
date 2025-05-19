import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../../../contexts/ClientProvider'
import { useClient } from '../../../../hooks/useClient'
import { useQuivrApiContext } from '../../../../hooks/useQuivrApiContext'
import { useZendesk } from '../../../../hooks/useZendesk'
import styles from './ResponseContainer.module.scss'
import { normalizeNewlinesToHtml } from '../../../../shared/helpers/html'
import { Autodraft } from '../../../../types/zendesk'
import { Icon } from '../../../../shared/components/Icon/Icon'
import Tooltip from '../../../../shared/components/Tooltip/Tooltip'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
  ongoingTask: boolean
  autoDraft: Autodraft | null
  onCopyDraft: () => Promise<void>
}

export const ResponseContainer = ({
  responseContent,
  setResponseContent,
  ongoingTask,
  autoDraft,
  onCopyDraft
}: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const client = useClient() as ZAFClient
  const { getTicketId, sendMessage } = useZendesk()
  const { quivrService } = useQuivrApiContext()
  const [isAutosendableFeedbackOpen, setIsAutosendableFeedbackOpen] = useState(true)

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
      setIsAutosendableFeedbackOpen(false)
    }
    if (!ongoingTask) {
      setRating(0)
    }
  }, [ongoingTask])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (autoDraft?.prediction?.is_autosendable) {
      return
    }

    setManualEditing(true)
    setResponseContent(event.currentTarget.innerHTML)
  }

  const handleStarClick = async (value: number) => {
    setRating(value)
    const ticketId = await getTicketId(client)

    if (!ticketId) return

    try {
      await quivrService?.rateGeneratedAnswer(ticketId, value, '')
    } catch (error) {
      console.error('Error rating generated answer', error)
    }
  }

  const openFeedbackModal = ({ autosendable = false }: { autosendable?: boolean }) => {
    client
      .invoke('instances.create', {
        location: 'modal',
        url: 'http://localhost:3000/modal',
        size: { width: '280px', height: autosendable ? '150px' : '300px' }
      })
      .then(async (modalContext) => {
        const modalGuid = modalContext['instances.create'][0].instanceGuid
        const modalClient = client.instance(modalGuid)

        if (autosendable) {
          modalClient.on('modal.ready', function () {
            modalClient.trigger('modal.data_autosend', {
              ticketAnswerId: autoDraft?.ticket_answer_id,
              predictionId: autoDraft?.prediction?.prediction_id
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
            }
          })
        } else {
          const ticketId = await getTicketId(client)

          modalClient.on('modal.ready', function () {
            modalClient.trigger('modal.data', {
              ticketId: ticketId,
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
          {autoDraft?.prediction?.is_autosendable && autoDraft?.prediction?.is_accepted === null && isAutosendableFeedbackOpen ? (
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
                    <Icon name="check" color="success" size="small" />
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
