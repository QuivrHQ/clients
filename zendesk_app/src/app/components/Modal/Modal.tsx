import { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import FeedbackModal, { FeedbackModalProps } from '../FeedbackModal/FeedbackModal'
import AutosendModal, { AutosendModalProps } from '../AutosendModal/AutosendModal'
import posthog from 'posthog-js'
import { trackingEvents } from '@constants/tracking-events'
import { LoaderIcon } from '../../shared/components/LoaderIcon/LoaderIcon'
import styles from './Modal.module.scss'

export const Modal = (): JSX.Element | null => {
  const client = useClient() as ZAFClient
  const [modalType, setModalType] = useState<'feedback' | 'autosend'>('feedback')
  const [modalContent, setModalContent] = useState<FeedbackModalProps | AutosendModalProps | null>(null)

  useEffect(() => {
    if (modalContent) {
      posthog.capture(trackingEvents.MODAL_CONTENT_LOADED)
    }
  }, [modalContent])

  useEffect(() => {
    posthog.capture(trackingEvents.MODAL_OPENED, {
      zendesk_client_loaded: Boolean(client)
    })
    if (!client) return

    const handleData = (incomingData: FeedbackModalProps) => {
      setModalType('feedback')
      setModalContent(incomingData)
    }
    const handleAutosend = (incomingData: AutosendModalProps) => {
      setModalType('autosend')
      setModalContent(incomingData)
    }

    client.on('modal.data', handleData)
    client.on('modal.data_autosend', handleAutosend)

    client.trigger('modal.ready')
    posthog.capture(trackingEvents.MODAL_READY)

    return () => {
      client.off('modal.data', handleData)
      client.off('modal.data_autosend', handleAutosend)
    }
  }, [client])

  if (!modalContent)
    return (
      <div className={styles.loader_container}>
        <LoaderIcon size="big" color="black" />
      </div>
    )

  return (
    <>
      {modalType === 'feedback' && <FeedbackModal {...(modalContent as FeedbackModalProps)} />}
      {modalType === 'autosend' && <AutosendModal {...(modalContent as AutosendModalProps)} />}
    </>
  )
}

export default Modal
