import React, { useEffect, useRef, type JSX } from 'react'

import { Icon } from '../../../../shared/components/Icon/Icon'
import styles from './IterationTextbox.module.scss'

interface IterationTextboxProps {
  value: string
  hasDraftResponse: boolean
  setValue: (value: string) => void
  onSubmit: () => void
  ongoingTask: boolean
}

export const IterationTextbox = ({
  value,
  setValue,
  onSubmit,
  hasDraftResponse,
  ongoingTask
}: IterationTextboxProps): JSX.Element => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      if (!ongoingTask) {
        onSubmit()
        setValue('')
      }
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 5 * parseFloat(getComputedStyle(textareaRef.current).lineHeight ?? '20')
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [value])

  return (
    <div className={styles.chatbar_wrapper}>
      <div className={styles.chatbar}>
        <textarea
          ref={textareaRef}
          placeholder={hasDraftResponse ? 'Modify this draft...' : 'Ask Quivr...'}
          className={styles.input}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button className={styles.submit_button} onClick={onSubmit} disabled={ongoingTask || !value}>
          <Icon name="send" size="normal" color="accent" disabled={ongoingTask || !value} />
        </button>
      </div>
    </div>
  )
}

export default IterationTextbox
