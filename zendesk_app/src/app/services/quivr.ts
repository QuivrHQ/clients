import { TicketIngestionProgress, ZendeskConnection, ZendeskTask } from '../types/zendesk'

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
        return 'https://api-gobocom.quivr.app'
      }
      return 'https://api.quivr.app'
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

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.quivrApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
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
    let isDone = false

    try {
      while (!isDone) {
        const { done, value } = await reader.read()
        isDone = done

        if (done) {
          this.processIncompleteData(buffer, onStreamMessage)
          reader.releaseLock()
          break
        }

        buffer = this.processStreamData(value, buffer, decoder, onStreamMessage)
      }
    } catch (error) {
      console.error('Error processing stream:', error)
    } finally {
      reader.releaseLock()
    }

    return accumulatedMessage
  }

  private processStreamData(
    value: Uint8Array,
    buffer: string,
    decoder: TextDecoder,
    onStreamMessage: (message: string) => void
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
          onStreamMessage(newContent)
        } catch (e) {
          console.error('Error parsing data string', e)
        }
      }
    })

    return buffer
  }

  private processIncompleteData(buffer: string, onStreamMessage: (message: string) => void) {
    if (buffer !== '') {
      try {
        const parsedData = JSON.parse(buffer)
        const newContent = parsedData.assistant ?? ''
        onStreamMessage(newContent)
      } catch (e) {
        console.error('Error parsing incomplete data at stream end', e)
      }
    }
  }

  async getAutoDraft(ticketId: string): Promise<string> {
    try {
      const response = await this.client.request({
        url: `${this.apiUrl}/zendesk/autodraft?ticket_id=${ticketId}`,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${this.quivrApiKey}`
        },
        accepts: 'application/json'
      })

      return response
    } catch (error) {
      throw new Error('Failed to get auto draft')
    }
  }
}
