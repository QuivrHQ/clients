import React, { useEffect, useRef } from 'react'
import styles from './TextAreaInput.module.scss'

type TextAreaInputProps = {
  label: string
  inputValue: string | string[]
  setInputValue: (value: string | string[]) => void
  onSubmit?: () => void
  disabled?: boolean
  expandable?: boolean
  isArray?: boolean
  autoFocus?: boolean
  rows?: number
}

export const TextAreaInput = ({
  label,
  inputValue,
  setInputValue,
  onSubmit,
  disabled = false,
  expandable,
  isArray = false,
  autoFocus = false,
  rows
}: TextAreaInputProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textAreaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
      textarea.style.maxHeight = `700px`
    }
  }

  useEffect(() => {
    if (expandable) {
      adjustHeight()
    }
  }, [inputValue, expandable])

  useEffect(() => {
    if (autoFocus && textAreaRef.current) {
      const textarea = textAreaRef.current
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (isArray) {
      const lines = value.split('\n').filter((line, index) => index !== 0 || line.trim() !== '')
      setInputValue(lines)
    } else {
      setInputValue(value)
    }
    if (expandable) {
      adjustHeight()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleBlur = () => {
    if (onSubmit) {
      onSubmit()
    }
  }

  return (
    <div className={`${styles.text_area_input_container} ${disabled ? styles.disabled : ''}`}>
      <textarea
        ref={textAreaRef}
        className={styles.text_area_input}
        value={isArray ? (inputValue as string[]).join('\n') : (inputValue as string)}
        onChange={handleChange}
        placeholder={label}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        rows={rows ?? 3}
        style={{ resize: 'none' }}
      />
    </div>
  )
}

export default TextAreaInput
