import React, { useEffect, useState, type JSX } from 'react'
import { useClient } from '../../hooks/useClient'
import { QuivrService } from '../../services/quivr'
import { SplitButtonType } from '../../types/button'

import styles from './ReplyBoxApp.module.scss'

export const ReplyBoxApp = (): JSX.Element => {
  const client = useClient()
  const [quivrService, setQuivrService] = useState<QuivrService | null>(null)

  const buttons: SplitButtonType[] = [
    {
      label: 'Generate Draft',
      onClick: () => {
        console.info('generate')
      },
      iconName: 'chevronRight'
    },
    {
      label: 'Rewrite Reply',
      onClick: () => {
        console.info('generate')
      },
      iconName: 'chevronRight'
    },
    {
      label: 'Correct Reply',
      onClick: () => {
        console.info('generate')
      },
      iconName: 'chevronRight'
    },
    {
      label: 'Summarize Ticket',
      onClick: () => {
        console.info('generate')
      },
      iconName: 'chevronRight'
    }
  ]
  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '100px' })

    const initializeQuivrService = async () => {
      const service = new QuivrService('https://api.quivr.app', client)
      setQuivrService(service)
    }

    initializeQuivrService()
  }, [client])

  return (
    <div className={styles.content_container}>
      <div className={styles.buttons_container}>
        {buttons.map((button, index) => (
          <button key={index} className={styles.button} onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ReplyBoxApp
