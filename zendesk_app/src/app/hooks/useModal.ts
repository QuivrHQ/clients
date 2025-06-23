import { useCallback } from 'react'
import { ZAFClient } from '../contexts/ClientProvider'

interface ModalOptions {
  autosendable?: boolean
  askForFeedback?: boolean
  payload: Record<string, unknown>
  onCopyDraft?: () => void
  onSendDraft?: () => Promise<void>
  onRejectDraft?: () => void
}

const getModalSize = (autosendable: boolean, askForFeedback: boolean) => {
  if (autosendable) {
    return {
      width: askForFeedback ? '600px' : '280px',
      height: askForFeedback ? '500px' : '150px'
    }
  }
  return { width: '280px', height: '300px' }
}

export function useModal(client: ZAFClient) {
  return useCallback(
    async ({
      autosendable = false,
      askForFeedback = false,
      payload,
      onCopyDraft,
      onSendDraft,
      onRejectDraft
    }: ModalOptions) => {
      const { 'instances.create': instances } = await client.invoke('instances.create', {
        location: 'modal',
        url: import.meta.env.VITE_ZENDESK_MODAL_LOCATION,
        size: getModalSize(autosendable, askForFeedback)
      })

      const guid = instances[0].instanceGuid
      const modalClient = client.instance(guid)

      const emitPayload = () => modalClient.trigger(autosendable ? 'modal.data_autosend' : 'modal.data', payload)

      modalClient.on('modal.ready', emitPayload)
      emitPayload()

      if (autosendable) {
        const dispose = () => {
          modalClient.off('modal.copy_draft', handleCopy)
          modalClient.off('modal.send_draft', handleSend)
          modalClient.off('modal.reject_draft', handleReject)
        }

        const handleCopy = () => {
          dispose()
          onCopyDraft?.()
        }
        const handleSend = async () => {
          dispose()
          await onSendDraft?.()
        }
        const handleReject = () => {
          dispose()
          onRejectDraft?.()
        }

        modalClient.on('modal.copy_draft', handleCopy)
        modalClient.on('modal.send_draft', handleSend)
        modalClient.on('modal.reject_draft', handleReject)
      }
    },
    [client]
  )
}
