import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../../../contexts/ClientProvider'
import { useClient } from '../../../../hooks/useClient'
import { useQuivrApiContext } from '../../../../hooks/useQuivrApiContext'
import { useZendesk } from '../../../../hooks/useZendesk'
import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
  ongoingTask: boolean
}

export const ResponseContainer = ({
  responseContent,
  setResponseContent,
  ongoingTask
}: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const client = useClient() as ZAFClient
  const { getTicketId } = useZendesk()
  const { quivrService } = useQuivrApiContext()

  useEffect(() => {
    if (!manualEditing) {
      const parseMarkdown = async () => {
        const html = await marked(responseContent)
        setHtmlContent(html)
      }
      void parseMarkdown()
    }
  }, [responseContent])

  useEffect(() => {
    if (!ongoingTask) {
      setRating(0)
    }
  }, [ongoingTask])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    setManualEditing(true)
    setResponseContent(event.currentTarget.innerHTML)
  }

  const handleStarClick = async (value: number) => {
    setRating(value)
    const ticketId = await getTicketId(client)

    if (!ticketId) return

    try {
      await quivrService?.rateGeneratedAnswer(ticketId, rating, '')
    } catch (error) {
      console.error('Error rating generated answer', error)
    }
  }

  const openFeedbackModal = () => {
    client
      .invoke('instances.create', {
        location: 'modal',
        url: 'http://localhost:3000/modal',
        size: { width: '280px', height: '300px' }
      })
      .then(async (modalContext) => {
        const modalGuid = modalContext['instances.create'][0].instanceGuid
        const modalClient = client.instance(modalGuid)
        const ticketId = await getTicketId(client)

        modalClient.on('modal.ready', function () {
          modalClient.trigger('modal.data', {
            ticketId: ticketId,
            rating: rating
          })
        })
      })
  }

  return (
    <div className={styles.main_container}>
      <div
        className={styles.response_container}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleInput}
        onBlur={() => setManualEditing(false)}
      ></div>
      {!ongoingTask && (
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
          <span className={styles.feedback_button} onClick={openFeedbackModal}>
            - Add details
          </span>
        </div>
      )}
    </div>
  )
}

export default ResponseContainer
