import { type JSX, useEffect, useState } from 'react'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import styles from './AutosendModal.module.scss'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import { ZendeskConversationEntry, ZendeskMessage } from 'src/app/types/zendesk'

export interface AutosendModalProps {
  ticketAnswerId: string
  predictionId: string
  askForFeedback: boolean
  response: string
  endUserMessage: ZendeskConversationEntry
}

export const AutosendModal = ({
  ticketAnswerId,
  predictionId,
  askForFeedback,
  response,
  endUserMessage
}: AutosendModalProps): JSX.Element => {
  const client = useClient() as ZAFClient
  const { quivrService } = useQuivrApiContext()

  useEffect(() => {
    if (!askForFeedback) {
      updatePredictionAcceptance(true)
    }
  }, [quivrService])

  const updatePredictionAcceptance = async (isAccepted: boolean) => {
    if (!quivrService) return

    try {
      if (!isAccepted) {
        client.trigger('modal.reject_draft')
        client.invoke('destroy')
      }

      await quivrService.updatePredictionAcceptance(predictionId, ticketAnswerId, isAccepted)
    } catch (error) {
      console.error('Error sending prediction acceptance', error)
    }
  }

  const handleSend = async () => {
    client.trigger('modal.send_draft')
    client.invoke('destroy')
  }

  const handleEdit = async () => {
    client.trigger('modal.copy_draft')
    client.invoke('destroy')
  }

  const getEndUserContentHtml = (conversationEntry: ZendeskConversationEntry) => {
    const messageContent = (conversationEntry.message.content || '').replace(
      /<a\b(?![^>]*\btarget=)[^>]*>/gi,
      (match: string) => {
        // Add target and rel attributes to open links in a new tab
        return match.replace(/<a/, '<a target="_blank" rel="noopener noreferrer"');
      }
    );
  
    const attachmentLinks = conversationEntry.attachments
      ?.map(
        (att: any) => `
        <div style="margin-top: 1em;">
          <a href="${att.contentUrl}" target="_blank" rel="noopener noreferrer">
            📎 ${att.filename}
          </a>
        </div>
      `
      )
      .join('') || '';
  
    return `${messageContent}${attachmentLinks}`;
  };

  return (
    <div className={styles.main_container}>
      {askForFeedback ? (
        <div className={styles.feedback_container}>
          <div>
            <p>This answer has been marked as ready to send.</p>
            <p>Would you like to review it and confirm if it’s sendable or not?</p>

            <div className={styles.responses_container}>
              <div className={styles.response_container}>
                <p className={styles.response_title}>Customer message</p>
                <div
                  className={styles.response_content}
                  contentEditable={false}
                  dangerouslySetInnerHTML={{ __html: getEndUserContentHtml(endUserMessage) }}
                />
              </div>
              <div className={styles.response_container}>
                <p className={styles.response_title}>Quivr's generated answer</p>
                <div
                  className={styles.response_content}
                  contentEditable={false}
                  dangerouslySetInnerHTML={{ __html: response }}
                />
              </div>
            </div>
          </div>
          <div className={styles.buttons}>
            <QuivrButton label="Close modal" onClick={() => client.invoke('destroy')} color="dangerous" />
            <div className={styles.feedback_buttons}>
              <QuivrButton
                label="No, it is not sendable"
                onClick={() => updatePredictionAcceptance(false)}
                color="zendesk-secondary"
                iconName="close"
              />
              <QuivrButton
                label="Yes, it is sendable"
                onClick={() => {
                  updatePredictionAcceptance(true)
                  handleEdit()
                }}
                color="zendesk"
                iconName="check"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.text}>
            <div>
              <p>Thank you for your feedback!</p>
              <p>Quivr has marked this message as ready to send.</p>
            </div>
            <p>Would you like to send it like this, or make a quick edit first?</p>
          </div>
          <div className={styles.buttons}>
            <QuivrButton label="Continue editing" onClick={handleEdit} color="zendesk-secondary" iconName="edit" />
            <QuivrButton label="Send" onClick={handleSend} color="zendesk" iconName="send" />
          </div>
        </>
      )}
    </div>
  )
}

export default AutosendModal
