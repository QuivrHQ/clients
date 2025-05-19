import { useEffect, useState, type JSX } from 'react'
import { ZAFClient } from '../../contexts/ClientProvider'
import { useClient } from '../../hooks/useClient'
import FeedbackModal, { FeedbackModalProps } from '../FeedbackModal/FeedbackModal'
import AutosendModal, { AutosendModalProps } from '../AutosendModal/AutosendModal'

export const Modal = (): JSX.Element => {
  const client = useClient() as ZAFClient
  const [modalType, setModalType] = useState<'feedback' | 'autosend'>('feedback')
  const [modalContent, setModalContent] = useState<FeedbackModalProps | AutosendModalProps | null>(null)

  useEffect(() => {
    if (!client) return
    client.trigger('modal.ready')

    client.on('modal.data', (incomingData: FeedbackModalProps) => {
      setModalType('feedback')
      setModalContent(incomingData)
    })
    client.on('modal.data_autosend', (incomingData: AutosendModalProps) => {
      setModalType('autosend')
      setModalContent(incomingData)
    })
  }, [client])

  
  return (
    <>
      {modalType === 'feedback' && <FeedbackModal {...modalContent as FeedbackModalProps} />}
      {modalType === 'autosend' && <AutosendModal {...modalContent as AutosendModalProps} />}
    </>
  )
}

export default Modal
