import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { useClient } from '../../../../hooks/useClient'

import { ZAFClient } from 'src/app/contexts/ClientProvider'
import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)
  const client = useClient() as ZAFClient

  useEffect(() => {
    if (!manualEditing) {
      const parseMarkdown = async () => {
        const html = await marked(responseContent)
        setHtmlContent(html)
      }
      void parseMarkdown()
    }
  }, [responseContent])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    setManualEditing(true)
    setResponseContent(event.currentTarget.innerHTML)
  }

  const openFeedbackModal = () => {
    client.invoke('instances.create', {
      location: 'modal',
      url: 'http://localhost:3000/modal',
      size: { width: '400px', height: '200px' },
      context: { message: 'hello' }
    })
  }

  return (
    <div className={styles.main_container}>
      <div
        className={styles.response_container}
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleInput}
        onBlur={() => setManualEditing(false)}
      ></div>
      <span className={styles.feedback_button} onClick={openFeedbackModal}>
        Give us feedback
      </span>
    </div>
  )
}

export default ResponseContainer
