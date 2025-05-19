import { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import TextAreaInput from '../../shared/components/TextAreaInput/TextAreaInput'
import styles from './FeedbackModal.module.scss'

const ratingDescriptions = ['Pas du tout pertinent', 'Un peu utile', 'Assez pertinent', 'Presque parfait', 'Parfait']

export interface FeedbackModalProps {
  ticketId: string
  rating: number
}

export const FeedbackModal = ({ ticketId, rating }: FeedbackModalProps): JSX.Element => {
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
    if (!ticketId) return
    setLoading(true)

    try {
      await quivrService?.rateGeneratedAnswer(ticketId, localRating, feedback)
      setLoading(false)
      client.invoke('destroy')
    } catch (error) {
      console.error('Error rating generated answer', error)
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
