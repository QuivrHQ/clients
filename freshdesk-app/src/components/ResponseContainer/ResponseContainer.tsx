import { useEffect, useRef, useState } from 'react'
import type { ElementRef } from 'react'
import { FwButton, FwButtonGroup, FwIcon, FwListOptions, FwPopover, FwTextarea } from '@freshworks/crayons/react'
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
  const popRef = useRef<ElementRef<typeof FwPopover> | null>(null)
  const listRef = useRef<ElementRef<typeof FwListOptions> | null>(null)

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

  const options = [
    { value: 'Reformulate', text: 'Reformulate reply', hideTick: true },
    { value: 'Correct', text: 'Correct reply', hideTick: true },
    { value: 'Translate', text: 'Translate reply', hideTick: true },
    { value: 'Summarize', text: 'Summarize ticket', hideTick: true }
  ]
  const handleSelect = async (e: CustomEvent<any>) => {
    console.log('Selected:', e.detail?.value)
    await popRef.current?.hide() // close after select
    const selectedValue = await listRef.current?.getSelectedOptions()

    console.log('Selected value:', selectedValue)
    await listRef.current?.setSelectedOptions([])
    const selectedValue2 = await listRef.current?.getSelectedOptions()

    console.log('Selected value:', selectedValue2)
  }
  return (
    <div className="fw-p-4 fw-gap-2 fw-flex fw-flex-column">
      <div className="fw-flex fw-justify-between">
        {/*  <FwButton
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
          Copy draft
        </FwButton> */}

        <FwPopover ref={popRef} sameWidth trigger="click" variant="select">
          <FwButtonGroup slot="popover-trigger">
            <FwButton
              color="primary"
              disabled={false}
              onClick={() => {
                console.log('Generate draft')
              }}
            >
              Generate draft
            </FwButton>
            <FwButton size="icon" disabled={false}>
              <FwIcon name="chevron-down" slot="after-label" />
            </FwButton>
          </FwButtonGroup>

          <FwListOptions
            ref={listRef}
            multiple={false}
            slot="popover-content"
            options={options}
            onFwChange={handleSelect}
          />
        </FwPopover>
      </div>
      <FwTextarea ref={editorRef} rows={20} value={draft ?? ''} state="normal" />
    </div>
  )
}

export default ResponseContainer
