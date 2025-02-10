export class QuivrService {
  private apiUrl: string
  private apiKey: string

  constructor(apiUrl: string, client: any) {
    this.apiUrl = apiUrl
    this.initialize(client)
  }

  private async initialize(client: any) {
    this.apiKey = await client.metadata().then(function (metadata) {
      return metadata.settings.quivr_api_key
    })
  }

  async getNewChatId(name: string): Promise<Response> {
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

    return (await response.json()).chat_id
  }

  async getQuivrResponse(prompt, chatId) {
    const response = await fetch(
      `${this.apiUrl}/chat/${chatId}/question/stream?brain_id=0973ff75-c0ae-468e-99b4-7ae4130adcad`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          accept: 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
          brain_id: '0973ff75-c0ae-468e-99b4-7ae4130adcad'
        }),
        mode: 'cors'
      }
    )

    if (!response.ok || response.body === null) {
      throw new Error('Network response was not ok')
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
