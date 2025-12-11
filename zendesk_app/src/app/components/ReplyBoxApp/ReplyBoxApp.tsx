import { marked } from 'marked'
import { useEffect, type JSX } from 'react'
import { useClient } from '../../hooks/useClient'

import { useExecuteZendeskTaskContext } from '../../contexts/ExecuteZendeskTaskProvider'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useActionButtons } from '../../hooks/useActionButtons'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'
import { useZendesk } from '../../hooks/useZendesk'
import { LoaderIcon } from '../../shared/components/LoaderIcon/LoaderIcon'
import { normalizeNewlinesToHtml } from '../../shared/helpers/html'
import ActionButton from './ActionButton/ActionButton'
import styles from './ReplyBoxApp.module.scss'

const ACTION_BUTTON_HEIGHT = 34

export const ReplyBoxApp = (): JSX.Element => {
  const client = useClient() as ZAFClient
  const { actionButtons } = useActionButtons()
  const { quivrService, zendeskConnection } = useQuivrApiContext()
  const { loading, response, submitTask, setResponse } = useExecuteZendeskTaskContext()
  const { getTicketId, setCommentType, setUserInput } = useZendesk()

  useEffect(() => {
    const setInput = async () => {
      const htmlContent = await marked(normalizeNewlinesToHtml(response))
      await setUserInput(client, htmlContent)
    }

    if (response && response !== '.' && response !== '..' && response !== '...') {
      setInput()
    }
  }, [response, client])

  useEffect(() => {
    client.invoke('resize', { width: '200px', height: `${ACTION_BUTTON_HEIGHT * actionButtons.length + 8}px` })
  }, [client])


  useEffect(() => {
    const getAutoDraft = async () => {
      if (!quivrService || !zendeskConnection?.helpdesk_brains.some((link) => link.auto_draft_front)) {
        return
      }

      const ticketId = await getTicketId(client)
      const autoDraft = await quivrService.getAutoDraft(ticketId)


      if (!autoDraft?.generated_answer) {
        return
      }

      const htmlContent = await marked(normalizeNewlinesToHtml(autoDraft.generated_answer))

      if (zendeskConnection?.autodraft_in_internal_note_composer) {
        await setCommentType(client, 'internalNote')
        await setUserInput(client, htmlContent)
      }

      if (zendeskConnection?.enable_autodraft_in_reply_box) {
        await setCommentType(client, 'publicReply')
        await setUserInput(client, htmlContent)
      }
    }

    getAutoDraft()
  }, [
    quivrService,
    zendeskConnection?.enable_autodraft_in_reply_box,
    zendeskConnection?.autodraft_in_internal_note_composer,
    zendeskConnection?.helpdesk_brains
  ])

  return (
    <div className={`${styles.content_container} ${loading ? styles.loading : ''}`}>
      {loading ? (
        <div className={styles.loading_box}>
          <span>Loading...</span>
          <LoaderIcon size="big" color="black" />
        </div>
      ) : (
        <div className={styles.buttons_container}>
          {actionButtons.map((button, index) => (
            <div key={index}>
              <ActionButton
                button={button}
                onClick={(action) => submitTask(action, { onFinish: () => client.invoke('close') })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReplyBoxApp
