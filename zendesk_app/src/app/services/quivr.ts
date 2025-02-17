import { ZendeskTask } from '../types/zendesk'

export class QuivrService {
  private apiUrl: string
  private apiKey: string
  private zendeskApiKey: string

  constructor(apiUrl: string, client: any) {
    this.apiUrl = apiUrl
    this.initialize(client)
  }

  private async initialize(client: any) {
    this.apiKey = await client.metadata().then(function (metadata) {
      return metadata.settings.quivr_api_key
    })

    this.zendeskApiKey = await client.metadata().then(function (metadata) {
      return metadata.settings.zendesk_api_key
    })
  }

  async getZendeskConnection(): Promise<string> {
    const response = await fetch(`${this.apiUrl}/zendesk/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      },
      mode: 'cors'
    })

    if (!response.ok) {
      throw new Error('Failed to get zendesk link')
    }

    return await response.json()
  }

  async createZendeskConnection(subdomain: string, userEmail: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/zendesk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      },
      body: JSON.stringify({
        subdomain: `${subdomain}.zendesk.com`,
        email: userEmail,
        api_key: this.zendeskApiKey,
        time_range: 180
      }),
      mode: 'cors'
    })

    if (!response.ok) {
      throw new Error('Failed to create zendesk link')
    }

    return await response.json()
  }

  async getNewChatId(name: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      },
      body: JSON.stringify({
        name: name
      }),
      mode: 'cors'
    })

    if (!response.ok) {
      throw new Error('Failed to get new chat id')
    }

    const data = await response.json()
    return data.chat_id
  }

  async executeZendeskTask(task: ZendeskTask, chatId: string, prompt: string, ticketId: string, content: string) {
    const url = new URL(`${this.apiUrl}/zendesk/task/${task}`)
    url.searchParams.append('chat_id', chatId)
    url.searchParams.append('ticket_id', ticketId)
    url.searchParams.append('system_prompt', prompt)
    url.searchParams.append('content', content)
    url.searchParams.append('stream', 'true')

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      },
      mode: 'cors'
    })

    if (!response.ok || response.body === null) {
      const errorText = await response.text()
      throw new Error(`Network response was not ok: ${errorText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let result = ''
    let done = false

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      result += decoder.decode(value, { stream: true })
    }

    return result
      .match(/data: (.+?)(?=data:|$)/g)
      ?.map((match) => JSON.parse(match.replace('data: ', '')).assistant)
      .join('')
  }
}
