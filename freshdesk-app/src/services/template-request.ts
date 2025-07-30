import type { FreshdeskClient } from '../types/freshdesk'

export interface TemplateRequestOptions {
  cache?: boolean
  ttl?: number
  oauth?: string
}

export interface InvokeTemplateParams<C = Record<string, unknown>, B = unknown> {
  templateName: string
  context?: C
  body?: B
  options?: TemplateRequestOptions
}

interface TemplateRequestErrorCause {
  response: string
  status: number
  errorSource: string
  headers: Record<string, string>
}

export class TemplateRequestError extends Error {
  readonly templateName: string

  constructor(templateName: string, cause: TemplateRequestErrorCause) {
    super(`Template "${templateName}" failed: [${cause.status}] ${cause.response}`)
    this.templateName = templateName
    this.name = 'TemplateRequestError'
  }
}

export class TemplateRequestService {
  private readonly client: FreshdeskClient

  constructor(client: FreshdeskClient) {
    this.client = client
  }

  async invoke<Response = unknown, Context = Record<string, unknown>, Body = unknown>(
    params: InvokeTemplateParams<Context, Body>
  ): Promise<Response> {
    const { templateName, context, body, options } = params

    try {
      const sdkResponse = await this.client.request.invokeTemplate(templateName, {
        context,
        options,
        body: body ? JSON.stringify(body) : undefined
      })

      const { response } = sdkResponse

      return (response ? JSON.parse(response) : undefined) as Response
    } catch (err) {
      throw new TemplateRequestError(templateName, err as TemplateRequestErrorCause)
    }
  }
}
