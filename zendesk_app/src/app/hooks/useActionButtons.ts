import { ZendeskConnection, ZendeskTask } from '../types/zendesk'
import { useQuivrApiContext } from './useQuivrApiContext'

const buttons = [
  {
    label: 'Generate Draft',
    task: 'generate' as ZendeskTask,
    displayKey: 'display_generate_button',
    iconName: 'chevronRight'
  },
  {
    label: 'Rewrite Reply',
    task: 'reformulate' as ZendeskTask,
    displayKey: 'display_reformulate_button',
    iconName: 'chevronRight'
  },
  {
    label: 'Correct Reply',
    task: 'correct' as ZendeskTask,
    displayKey: 'display_correct_button',
    iconName: 'chevronRight'
  },
  {
    label: 'Translate Reply',
    task: 'translate' as ZendeskTask,
    displayKey: 'display_translate_button',
    iconName: 'chevronRight'
  },
  {
    label: 'Summarize Ticket',
    task: 'summarize' as ZendeskTask,
    displayKey: 'display_summarize_button',
    iconName: 'chevronRight'
  }
]

export const useActionButtons = () => {
  const { zendeskConnection } = useQuivrApiContext()
  const enabledButtons = buttons.filter(
    (button) => zendeskConnection?.[button.displayKey as keyof ZendeskConnection] ?? true
  )

  return {
    actionButtons: enabledButtons,
    isChatEnabled: zendeskConnection?.display_iterate_button ?? false
  }
}
