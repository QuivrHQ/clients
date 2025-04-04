import { marked } from 'marked'
import { useEffect, type JSX } from 'react'
import { useClient } from '../../hooks/useClient'

import { ZAFClient } from '../../contexts/ClientProvider'
import { LoaderIcon } from '../../shared/components/LoaderIcon/LoaderIcon'
import ActionButton from './ActionButton/ActionButton'
import styles from './ReplyBoxApp.module.scss'
import { useActionButtons } from '../../hooks/useActionButtons'
import { useExecuteZendeskTask } from '../../hooks/useExecuteZendeskTask'

const ACTION_BUTTON_HEIGHT = 34

export const ReplyBoxApp = (): JSX.Element => {
  const client = useClient() as ZAFClient
  const { actionButtons } = useActionButtons()
  const { loading, response, submitTask } = useExecuteZendeskTask()

  useEffect(() => {
    client.invoke('resize', { width: '200px', height: `${ACTION_BUTTON_HEIGHT * actionButtons.length + 8}px` })
  }, [client])

  useEffect(() => {
    if (response && response !== '.' && response !== '..' && response !== '...') {
      client.set('ticket.comment.text', marked(response.replace(/<br>/g, '\n')))
    }
  }, [response, client])

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
