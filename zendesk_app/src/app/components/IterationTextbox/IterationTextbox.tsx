import React, { type JSX } from 'react'

import { Icon } from '../../shared/components/Icon/Icon'
import styles from './IterationTextbox.module.scss'

interface IterationTextboxProps {
  value: string
  setValue: (value: string) => void
  onSubmit: () => void
}

export const IterationTextbox = ({ value, setValue, onSubmit }: IterationTextboxProps): JSX.Element => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
      setValue('')
    }
  }

  return (
    <div className={styles.chatbar_wrapper}>
      <div className={styles.chatbar}>
        <textarea
          placeholder="Modify this draft..."
          className={styles.input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className={styles.icon} onClick={onSubmit}>
          <Icon name="send" size="normal" color="accent" disabled={!value} />
        </div>
      </div>
    </div>
  )
}

export default IterationTextbox
