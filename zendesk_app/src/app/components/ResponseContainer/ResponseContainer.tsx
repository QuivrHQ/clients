import { marked } from 'marked'
import React, { type JSX, useEffect } from 'react'

import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  useEffect(() => {
    const parseContent = async () => {
      const parsedContent = await marked(responseContent)
      setResponseContent(parsedContent)
    }
    parseContent()
  }, [responseContent])

  return (
    <div>
      <div
        className={styles.response_container}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: responseContent }}
      ></div>
    </div>
  )
}

export default ResponseContainer
