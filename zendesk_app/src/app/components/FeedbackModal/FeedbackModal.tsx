import { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import TextAreaInput from '../../shared/components/TextAreaInput/TextAreaInput'
import styles from './FeedbackModal.module.scss'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import { useZendesk } from '../../hooks/useZendesk'

const ratingDescriptions = ['Pas du tout pertinent', 'Un peu utile', 'Assez pertinent', 'Presque parfait', 'Parfait']

export const FeedbackModal = (): JSX.Element => {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { quivrService } = useQuivrApiContext()

  const client = useClient() as ZAFClient

  const handleStarClick = (value: number) => {
    setRating(value)
  }

  useEffect(() => {
    if (!client) return;
    client.trigger('modal.ready');

    client.on('modal.data', (incomingData: { ticketId: string }) => {
      setTicketId(incomingData.ticketId)
    });
  }, [client]);

  const handleSubmit = async () => {
    if (!ticketId) return;
    setLoading(true);

    try{
      await quivrService?.rateGeneratedAnswer(ticketId, rating, feedback)
      setLoading(false);
      client.invoke('destroy')
    } catch (error) {
      console.error('Error rating generated answer', error)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.main_container}>
      <div className={styles.grade_container}>
        <span className={styles.title}>Rate the relevance of the response</span>
        <div className={styles.grade_wrapper}>
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
          {rating > 0 && <span className={styles.explaination}> {ratingDescriptions[rating - 1]}</span>}
        </div>
      </div>
      <TextAreaInput
        label="Enter your feedback (optional)"
        inputValue={feedback}
        setInputValue={setFeedback as (value: string | string[]) => void}
        expandable={true}
        rows={7}
      ></TextAreaInput>
      <div className={styles.button}>
        <QuivrButton
          label="Submit"
          onClick={handleSubmit}
          color="zendesk"
          iconName="send"
          isLoading={loading}
          disabled={rating === 0}
        ></QuivrButton>
      </div>
    </div>
  )
}

export default FeedbackModal
