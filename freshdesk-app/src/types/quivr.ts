export interface HelpdeskAccount {
  id: string
  email: string
  subdomain: string
  api_key: string
  workspace_id: string
  time_range: number
  triggers_id: string[]
  webhook_id: string
  helpdesk_brains: string[]
  brain_links: string[]
  external_endpoints: string[]
  ticket_fields: Record<string, unknown>
  user_fields: Record<string, unknown>
  tags: string[]
  provider: string
  display_generate_button: boolean
  display_translate_button: boolean
  display_summarize_button: boolean
  display_reformulate_button: boolean
  display_iterate_button: boolean
  display_correct_button: boolean
  enable_autodraft_in_reply_box: boolean
  autosend_enabled: boolean
  daily_autosend_limit: number
  question_categories: Record<string, unknown>
}

export interface CreateHelpdeskAccount {
  subdomain: string
  email: string
  api_key: string
  provider: string
  time_range: number
}

export interface Autodraft {
  ticket_answer_id: string
  generated_answer: string
  prediction?: {
    prediction_id: string
    confidence_score?: number
    is_autosendable?: boolean
    is_accepted: boolean | null
  }
}
