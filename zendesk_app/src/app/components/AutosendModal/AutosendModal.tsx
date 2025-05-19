import { type JSX, useEffect, useState } from 'react'
import QuivrButton from '../../shared/components/QuivrButton/QuivrButton'
import styles from './AutosendModal.module.scss'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import { useQuivrApiContext } from '../../hooks/useQuivrApiContext'

export interface AutosendModalProps { 
  ticketAnswerId: string
  predictionId: string
}

export const AutosendModal = ({ ticketAnswerId, predictionId }: AutosendModalProps): JSX.Element => {
  const client = useClient() as ZAFClient
  const { quivrService } = useQuivrApiContext()

  useEffect(() => {
    const updatePredictionAcceptance = async () => {
      if (!quivrService) return

      try {
        await quivrService.updatePredictionAcceptance(predictionId, ticketAnswerId, true)
      } catch (error) {
        console.error('Error sending prediction acceptance', error)
      }
    }

    updatePredictionAcceptance()
  }, [quivrService])

  const handleSend = async () => {
      client.trigger('modal.send_draft')
      client.invoke('destroy')
  }

  const handleEdit = async () => {
    client.trigger('modal.copy_draft')
    client.invoke('destroy')
  }

  return (
    <div className={styles.main_container}>
      <div className={styles.text}>
        <div>
        <p>Thank you for your feedback!</p>
        <p>Quivr has marked this message as ready to send.</p>
        </div>
        <p>Would you like to send it like this, or make a quick edit first?</p>
      </div>
      <div className={styles.buttons}>
        <QuivrButton
          label="Continue editing"
          onClick={handleEdit}
          color="zendesk-secondary"
          iconName="edit"
        />
        <QuivrButton
          label="Send"
          onClick={handleSend}
          color="zendesk"
          iconName="send"
        />
      </div>
    </div>
  )
}

export default AutosendModal
