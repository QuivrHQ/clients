import { useEffect, useRef, useState } from 'react'
import { FwButton, FwTextarea } from '@freshworks/crayons/react'
import { useQuivrClient } from '../../hooks/useQuivrClient/useQuivrClient'
import { useFreshdeskClient } from '../../context/FreshdeskClientContext/FreshdeskClientContext'
import { useAccountConfigContext } from '../../context/AccountConfigContext/AccountConfigContext'
import { normalizeNewlinesToHtml } from '../../utils/html'

const ResponseContainer: React.FC = () => {
  const { getAutodraft } = useQuivrClient()
  const client = useFreshdeskClient()
  const { accountConfig } = useAccountConfigContext()
  const [draft, setDraft] = useState<string | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!client || !accountConfig || draft) return

    async function loadDraft() {
      const ticket = await client?.data.get('ticket')
      if (!ticket?.ticket) return
      const draft = await getAutodraft(ticket.ticket.id.toString())
      setDraft(draft.generated_answer)

      if (accountConfig?.enable_autodraft_in_reply_box) {
        try {
          await client?.interface.trigger('click', {
            id: 'reply',
            text: normalizeNewlinesToHtml(draft.generated_answer)
          })
        } catch (error) {
          console.log('Reply box already open, setting value', error)

          await client?.interface.trigger('setValue', {
            id: 'editor',
            text: normalizeNewlinesToHtml(draft.generated_answer),
            replace: true
          })
        }
      }
    }

    loadDraft()
  }, [client, accountConfig])

  return draft ? (
    <div className="fw-p-4 fw-gap-2 fw-flex fw-flex-column">
      <div className="fw-flex">
        <FwButton
          size="small"
          color="secondary"
          onClick={async () => {
            await client?.interface.trigger('setValue', {
              id: 'editor',
              text: normalizeNewlinesToHtml(editorRef.current?.value ?? ''),
              replace: true
            })
          }}
        >
          Copy Draft
        </FwButton>
      </div>
      <FwTextarea ref={editorRef} rows={20} value={draft} state="normal" />
    </div>
  ) : (
    <p>No draft response found.</p>
  )
}

export default ResponseContainer
