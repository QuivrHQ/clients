import { logger } from './logger'
import {
  Autodraft,
  TicketIngestionProgress,
  UpdateTicketAnswer,
  ZendeskConnection,
  ZendeskTask,
  ZendeskUser
} from '../types/zendesk'

export class QuivrService {
  private apiUrl: string
  private client: any
  private quivrApiKey: string = ''

  constructor(apiUrl: string, client: any) {
    this.apiUrl = apiUrl
    this.client = client
    this.initialize(client)
  }

  private async initialize(client: any) {
    this.apiUrl = await client.context().then(function (context: { account: { subdomain: string } }) {
      if (context.account.subdomain === 'locservice') {
        return import.meta.env.VITE_QUIVR_GOBOCOM_API_URL
      }
      return import.meta.env.VITE_QUIVR_API_URL
    })
    this.quivrApiKey = await client.metadata().then(function (metadata: { settings: { quivr_api_token: any } }) {
      return metadata.settings.quivr_api_token
    })
  }

  async getZendeskConnection(): Promise<ZendeskConnection | null> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/`,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`
        },
        accepts: 'application/json',
        httpCompleteResponse: true
      })

      if (response.status === 204) {
        return null
      }

      return response.responseJSON
    } catch (error) {
      throw new Error('Failed to get zendesk connection')
    }
  }

  async createZendeskConnection(subdomain: string, userEmail: string): Promise<string> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/`,
        type: 'POST',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`,
          'Content-Type': 'application/json'
        },
        secure: true,
        accepts: 'application/json',
        data: JSON.stringify({
          subdomain: `${subdomain}.zendesk.com`,
          email: userEmail,
          api_key: import.meta.env.VITE_ZENDESK_API_KEY,
          time_range: 30
        })
      })

      return response
    } catch (error) {
      throw new Error('Failed to create zendesk link')
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<TicketIngestionProgress> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/fill_brain/${workflowId}`,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`
        },
        accepts: 'application/json'
      })

      return response
    } catch (error) {
      throw new Error('Failed to get workflow status')
    }
  }

  async getNewChatId(name: string): Promise<string> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/chat`,
        type: 'POST',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`,
          'Content-Type': 'application/json'
        },
        accepts: 'application/json',
        data: JSON.stringify({
          name: name
        })
      })

      if (!response) {
        throw new Error('No response received from chat creation')
      }

      if (!response.chat_id) {
        throw new Error('No chat_id in response')
      }

      return response.chat_id
    } catch (error) {
      console.error('Error in getNewChatId:', error)
      throw new Error(`Failed to get new chat id`)
    }
  }

  async executeZendeskTaskV2(
    task: ZendeskTask,
    chatId: string,
    custom_instructions: string,
    ticketId: string,
    draft_answer: string,
    user: ZendeskUser,
    onStreamMessage: (message: string, ticketAnswerId?: string) => void,
    onStreamError?: (error: string | null) => void
  ): Promise<string> {
    const url = new URL(`${this.apiUrl}/helpdesk-accounts/tickets/${ticketId}/tasks/${task}`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.quivrApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        draft_answer: draft_answer,
        custom_instructions: custom_instructions,
        chat_id: chatId,
        zt_input: {
          support_agent: {
            name: user.name,
            email: user.email,
            role: user.role,
            platform_user_id: user.id
          }
        }
      })
    })

    if (!response.body) {
      throw new Error('ReadableStream not supported or no body in response.')
    }

    return this.processStream(response.body, onStreamMessage, onStreamError)
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    onStreamMessage: (message: string, ticketAnswerId?: string) => void,
    onStreamError?: (error: string | null) => void
  ): Promise<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder('utf-8')

    let buffer = ''
    let accumulatedMessage = ''
    let isDone = false

    try {
      while (!isDone) {
        const { done, value } = await reader.read()
        isDone = done

        if (done) {
          this.processIncompleteData(buffer, onStreamMessage, onStreamError)
          reader.releaseLock()
          break
        }

        buffer = this.processStreamData(value, buffer, decoder, onStreamMessage, onStreamError)
      }
    } catch (error) {
      console.error('Error processing stream:', error)
      throw error
    } finally {
      reader.releaseLock()
    }

    return accumulatedMessage
  }

  private processStreamData(
    value: Uint8Array,
    buffer: string,
    decoder: TextDecoder,
    onStreamMessage: (message: string, ticketAnswerId?: string) => void,
    onStreamError?: (error: string | null) => void
  ): string {
    const rawData = buffer + decoder.decode(value)
    const dataStrings = rawData.split('data: ').filter(Boolean)

    dataStrings.forEach((data, index) => {
      if (!data.endsWith('\n') && index === dataStrings.length - 1) {
        buffer = data
      } else {
        try {
          const parsedData = JSON.parse(data.trim())
          const newContent = parsedData.assistant ?? ''
          const ticketAnswerId = parsedData.ticket_answer_id
          onStreamMessage(newContent, ticketAnswerId)
          if (onStreamError) {
            onStreamError(parsedData.errors ?? null)
          }
        } catch (e) {
          console.error('Error parsing data string', e)
        }
      }
    })

    return buffer
  }

  private processIncompleteData(
    buffer: string,
    onStreamMessage: (message: string, ticketAnswerId?: string) => void,
    onStreamError?: (error: string | null) => void
  ) {
    if (buffer !== '') {
      try {
        const parsedData = JSON.parse(buffer)
        const newContent = parsedData.assistant ?? ''
        const ticketAnswerId = parsedData.ticket_answer_id

        onStreamMessage(newContent, ticketAnswerId)
        if (onStreamError) {
          onStreamError(parsedData.errors ?? null)
        }
      } catch (e) {
        console.error('Error parsing incomplete data at stream end', e, buffer)
      }
    }
  }

  async getAutoDraft(ticketId: string): Promise<Autodraft | null> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/helpdesk-accounts/autodraft?helpdesk_ticket_id=${ticketId}`,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`
        },
        accepts: 'application/json'
      })
      
      return response
    } catch (error) {
      logger.error(error as Error, {
        message: 'Failed to get auto draft',
        ticketId
      })
      return null
    }
  }

  async updatePredictionAcceptance(predictionId: string, ticketAnswerId: string, isAccepted: boolean): Promise<void> {
    await this.client.request({
      url: `${this.apiUrl}/zendesk/prediction/${predictionId}`,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${this.quivrApiKey}`,
        'Content-Type': 'application/json'
      },
      accepts: 'application/json',
      data: JSON.stringify({
        ticket_answer_id: ticketAnswerId,
        is_accepted: isAccepted
      })
    })
  }

  async updateTicketAnswer(ticketAnswerId: string, payload: UpdateTicketAnswer): Promise<void> {
    await this.client.request({
      url: `${this.apiUrl}/zendesk/ticket_answer/${ticketAnswerId}`,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${this.quivrApiKey}`,
        'Content-Type': 'application/json'
      },
      accepts: 'application/json',
      data: JSON.stringify(payload)
    })
  }

  async rateGeneratedAnswer(ticketId: string, ratingScore: number, ratingComment: string): Promise<void> {
    await this.client.request({
      url: `${this.apiUrl}/zendesk/ticket_answer/rating`,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${this.quivrApiKey}`,
        'Content-Type': 'application/json'
      },
      accepts: 'application/json',
      data: JSON.stringify({
        zendesk_ticket_id: ticketId,
        support_agent_rating: {
          score: ratingScore,
          comment: ratingComment === '' ? null : ratingComment
        }
      })
    })
  }
}
