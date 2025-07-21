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
import { useModal } from '../../../../hooks/useModal'
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { featureFlags } from '@constants/feature-flags'
import posthog from 'posthog-js'
import { copyDraftSource, trackingEvents } from '@constants/tracking-events'

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
  const openModal = useModal(client)
  const autosendFeedbackModalEnabled = useFeatureFlagEnabled(featureFlags.AUTOSEND_FEEDBACK_MODAL)
  const autosendFeedbackEnabled = useFeatureFlagEnabled(featureFlags.AUTOSEND_FEEDBACK)
  const showAutosendFeedbackButtons =
    autoDraft?.prediction?.is_autosendable && autoDraft?.prediction?.is_accepted === null && autosendFeedbackEnabled

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
        !feedbackModalViewed &&
        autosendFeedbackModalEnabled &&
        autosendFeedbackEnabled
      ) {
        setFeedbackModalViewed(true)
        launchModalFeedback({ autosendable: true, askForFeedback: true })
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

  const launchModalFeedback = async ({
    askForFeedback = false,
    autosendable = false
  }: {
    askForFeedback: boolean
    autosendable: boolean
  }) => {
    let latestEndUserMessage = null
    try {
      latestEndUserMessage = autosendable ? await getLatestEndUserMessage(client) : null
    } catch (error) {
      console.error('Error getting latest end user message', error)
      return
    }

    openModal({
      autosendable,
      askForFeedback,
      payload: {
        ticketAnswerId: ticketAnswerId,
        predictionId: autoDraft?.prediction?.prediction_id,
        askForFeedback,
        response: htmlContent,
        endUserMessage: latestEndUserMessage,
        rating: rating
      },
      onCopyDraft: () => {
        onCopyDraft()
        setIsAutosendableFeedbackOpen(false)
        posthog.capture(trackingEvents.COPY_DRAFT, {
          autosendable: true,
          source: copyDraftSource.MODAL
        })
      },
      onSendDraft: async () => {
        setIsAutosendableFeedbackOpen(false)
        if (autoDraft?.generated_answer) {
          await sendMessage(client, autoDraft.generated_answer)
          await pasteInEditor(client, '')
        }
      },
      onRejectDraft: () => setIsAutosendableFeedbackOpen(false)
    })
  }

  const approveDraftResponse = () => {
    launchModalFeedback({ autosendable: true, askForFeedback: false })
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
        className={`${styles.response_container} ${showAutosendFeedbackButtons ? styles.autosendable : ''}`}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleInput}
        onBlur={() => setManualEditing(false)}
        onCopy={() => {
          posthog.capture(trackingEvents.COPY_DRAFT, {
            autosendable: autoDraft?.prediction?.is_autosendable,
            source: copyDraftSource.TEXT_EDITOR
          })
        }}
      ></div>
      {!ongoingTask && (
        <>
          {showAutosendFeedbackButtons && isAutosendableFeedbackOpen ? (
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
              <span
                className={styles.feedback_button}
                onClick={() => launchModalFeedback({ autosendable: false, askForFeedback: false })}
              >
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
