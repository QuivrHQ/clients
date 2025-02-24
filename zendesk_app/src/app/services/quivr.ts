import { TicketIngestionProgress, ZendeskTask } from '../types/zendesk'

export class QuivrService {
  private apiUrl: string
  private client: any

  constructor(apiUrl: string, client: any) {
    this.apiUrl = apiUrl
    this.client = client
  }

  async getZendeskConnection(): Promise<string | null> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/`,
        type: 'GET',
        headers: {
          Authorization: 'Bearer {{setting.quivr_api_key}}'
        },
        secure: true,
        accepts: 'application/json',
        httpCompleteResponse: true
      })

      if (response.status === 204) {
        return null
      }

      return response
    } catch (error) {
      throw new Error('Failed to get zendesk link')
    }
  }

  async createZendeskConnection(subdomain: string, userEmail: string): Promise<string> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/`,
        type: 'POST',
        headers: {
          Authorization: 'Bearer {{setting.quivr_api_key}}',
          'Content-Type': 'application/json'
        },
        secure: true,
        accepts: 'application/json',
        data: JSON.stringify({
          subdomain: `${subdomain}.zendesk.com`,
          email: userEmail,
          api_key: '{{setting.zendesk_api_key}}',
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
          Authorization: 'Bearer {{setting.quivr_api_key}}'
        },
        secure: true,
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
          Authorization: 'Bearer {{setting.quivr_api_key}}',
          'Content-Type': 'application/json'
        },
        secure: true,
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
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      throw new Error(`Failed to get new chat id: ${error.message}`)
    }
  }

  async executeZendeskTask(
    task: ZendeskTask,
    chatId: string,
    prompt: string,
    ticketId: string,
    content: string,
    onStreamMessage: (message: string) => void
  ): Promise<string> {
    const url = new URL(`${this.apiUrl}/zendesk/task/${task}`)
    url.searchParams.append('chat_id', chatId)
    url.searchParams.append('ticket_id', ticketId)
    url.searchParams.append('system_prompt', prompt)
    url.searchParams.append('content', content)
    url.searchParams.append('stream', 'true')

    console.info(`Request URL: ${url.toString()}`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: 'Bearer {{setting.quivr_api_key}}',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      secure: true,
      body: JSON.stringify({})
    })

    if (!response.body) {
      throw new Error('ReadableStream not supported or no body in response.')
    }

    return this.processStream(response.body, onStreamMessage)
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    onStreamMessage: (message: string) => void
  ): Promise<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder('utf-8')

    let buffer = ''
    let accumulatedMessage = ''
    let lastResponse: { assistant: string } | null = null
    let isDone = false

    try {
      while (!isDone) {
        const { done, value } = await reader.read()
        isDone = done

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        ;({ buffer, accumulatedMessage, lastResponse } = this.processBuffer(
          buffer,
          accumulatedMessage,
          lastResponse,
          onStreamMessage
        ))
      }

      return accumulatedMessage
    } catch (error) {
      console.error('Stream processing error:', error)
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  private processBuffer(
    buffer: string,
    accumulatedMessage: string,
    lastResponse: { assistant: string } | null,
    onStreamMessage: (message: string) => void
  ) {
    const dataPrefix = 'data: '

    while (buffer.includes(dataPrefix)) {
      const messageStart = buffer.indexOf(dataPrefix)
      const messageEnd = buffer.indexOf(dataPrefix, messageStart + dataPrefix.length)

      let jsonString
      if (messageEnd === -1) {
        jsonString = buffer.slice(messageStart + dataPrefix.length)
        buffer = ''
      } else {
        jsonString = buffer.slice(messageStart + dataPrefix.length, messageEnd)
        buffer = buffer.slice(messageEnd)
      }

      try {
        const data: {
          assistant?: string
        } = JSON.parse(jsonString.trim()) as {
          assistant?: string
        }
        const newContent = data.assistant ?? ''
        if (typeof newContent === 'string') {
          accumulatedMessage = newContent
          onStreamMessage(accumulatedMessage)
        }

        lastResponse = {
          assistant: accumulatedMessage
        }
      } catch (error) {
        console.warn('Failed to parse message:', {
          jsonString,
          error
        })
      }
    }

    return { buffer, accumulatedMessage, lastResponse }
  }
}
