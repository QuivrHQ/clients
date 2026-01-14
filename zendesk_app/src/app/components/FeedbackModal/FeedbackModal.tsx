import { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import TextAreaInput from '../../shared/components/TextAreaInput/TextAreaInput'
import styles from './FeedbackModal.module.scss'
import { logger } from '../../services/logger'

const ratingDescriptions = ['Pas du tout pertinent', 'Un peu utile', 'Assez pertinent', 'Presque parfait', 'Parfait']

export interface FeedbackModalProps {
  ticketAnswerId: string
  rating: number
}

export const FeedbackModal = ({ ticketAnswerId, rating }: FeedbackModalProps): JSX.Element => {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [localRating, setLocalRating] = useState(rating)
  const { quivrService } = useQuivrApiContext()

  const client = useClient() as ZAFClient

  useEffect(() => {
    setLocalRating(rating)
  }, [rating])

  const handleStarClick = (value: number) => {
    setLocalRating(value)
  }

  const handleSubmit = async () => {
    if (!ticketAnswerId) return
    setLoading(true)

    try {
      await quivrService?.updateTicketAnswer(ticketAnswerId, {
        support_agent_rating_score: localRating,
        support_agent_rating_comment: feedback
      })
      setLoading(false)
      client.invoke('destroy')
    } catch (error) {
      logger.error(error as Error, {
        message: 'Error rating generated answer',
        ticketAnswerId,
        rating: localRating
      })
    } finally {
      setLoading(false)
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
                  className={`${styles.star} ${starValue <= localRating ? styles.filled : ''}`}
                  onClick={() => handleStarClick(starValue)}
                >
                  ★
                </span>
              )
            })}
          </div>
          {localRating > 0 && <span className={styles.explaination}> {ratingDescriptions[localRating - 1]}</span>}
        </div>
      </div>
      <TextAreaInput
        label="Enter your feedback"
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
          disabled={feedback === '' || localRating === 0}
        ></QuivrButton>
      </div>
    </div>
  )
}

export default FeedbackModal
