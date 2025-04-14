import { useState, type JSX } from 'react'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import TextAreaInput from '../../shared/components/TextAreaInput/TextAreaInput'
import styles from './FeedbackModal.module.scss'

export const FeedbackModal = (): JSX.Element => {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  const handleStarClick = (value: number) => {
    setRating(value)
  }

  return (
    <div className={styles.main_container}>
      <h2>Rate the relevance of the response</h2>
      <div className={styles.stars_container}>
        {[...Array(10)].map((_, index) => {
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
      <TextAreaInput
        label="Enter you feedback here"
        inputValue={feedback}
        setInputValue={() => setFeedback}
      ></TextAreaInput>
      <QuivrButton
        label="Submit"
        onClick={() => {
          console.log('Feedback submitted:', { rating, feedback })
        }}
        color="primary"
        iconName="send"
      ></QuivrButton>
    </div>
  )
}

export default FeedbackModal
