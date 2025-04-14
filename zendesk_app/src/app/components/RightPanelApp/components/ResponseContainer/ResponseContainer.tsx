import { marked } from 'marked'
import React, { useEffect, useState, type JSX } from 'react'
import { useClient } from '../../../../hooks/useClient'
import { ZAFClient } from '../../../../contexts/ClientProvider'
import { useZendesk } from '../../../../hooks/useZendesk'

import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  const [htmlContent, setHtmlContent] = useState('')
  const [manualEditing, setManualEditing] = useState(false)
  const client = useClient() as ZAFClient
  const { getTicketId } = useZendesk()

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
      size: { width: '280px', height: '300px' },
    }).then(async (modalContext) => {
      const modalGuid = modalContext['instances.create'][0].instanceGuid;
      const modalClient = client.instance(modalGuid);
      const ticketId = await getTicketId(client)
    
      modalClient.on('modal.ready', function() {
        modalClient.trigger('modal.data', {
          ticketId: ticketId
        });
      });
    });
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
