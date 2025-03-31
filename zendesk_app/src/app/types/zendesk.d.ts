export type ZendeskTask = 'iterate' | 'reformulate' | 'generate' | 'correct' | 'summarize' | 'translate'

export interface TicketIngestionProgress {
  total_tickets: number
  processed_tickets: number
  status: 'RUNNING' | 'COMPLETED' | string
}
