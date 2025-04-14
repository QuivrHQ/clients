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
  const ratingDescriptions = ['Pas du tout pertinent', 'Un peu utile', 'Assez pertinent', 'Presque parfait', 'Parfait']

  return (
    <div className={styles.main_container}>
      <div className={styles.grade_container}>
        <h2>Rate the relevance of the response</h2>
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
          onClick={() => {
            console.log('Feedback submitted:', { rating, feedback })
          }}
          color="primary"
          iconName="send"
          disabled={rating === 0}
        ></QuivrButton>
      </div>
    </div>
  )
}

export default FeedbackModal
