import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'

import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    setHtmlContent(marked(responseContent))
  }, [responseContent])

  return (
    <div>
      <div
        className={styles.response_container}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      ></div>
    </div>
  )
}

export default ResponseContainer
