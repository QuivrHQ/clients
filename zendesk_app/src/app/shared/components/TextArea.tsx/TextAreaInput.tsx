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
}

export const TextAreaInput = ({
  label,
  inputValue,
  setInputValue,
  onSubmit,
  disabled = false,
  expandable,
  isArray = false
}: TextAreaInputProps) => {
  const textAreaRef = useRef(null)

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

  const handleChange = (e: { target: { value: any } }) => {
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
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
        disabled={disabled}
        rows={3}
        style={{ resize: 'none' }}
      />
    </div>
  )
}

export default TextAreaInput
