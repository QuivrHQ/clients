import React, { type JSX } from 'react'
import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
  total: number
  processed: number
}

const ProgressBar = ({ total, processed }: ProgressBarProps): JSX.Element => {
  const progress = (processed / total) * 100

  return (
    <div className={styles.progress_bar_container}>
      <div className={styles.progress_bar}>
        <div className={styles.progress} style={{ width: `${progress}%` }}></div>
      </div>
      <div className={styles.progress_text}>
        {processed} / {total} tickets processed
      </div>
    </div>
  )
}

export default ProgressBar
