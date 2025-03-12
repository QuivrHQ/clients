import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'

import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)

  useEffect(() => {
    if (!manualEditing) {
      setHtmlContent(marked(responseContent))
    }
  }, [responseContent])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    setManualEditing(true)
    setResponseContent(event.currentTarget.innerHTML)
  }

  return (
    <div>
      <div
        className={styles.response_container}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleInput}
        onBlur={() => setManualEditing(false)}
      ></div>
    </div>
  )
}

export default ResponseContainer
