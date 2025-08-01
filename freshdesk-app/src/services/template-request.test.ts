import { TemplateRequestService, TemplateRequestError, type TemplateRequestOptions } from './template-request'
import type { FreshdeskClient } from '../types/freshdesk'

const createMockClient = (): jest.Mocked<FreshdeskClient> => ({
  interface: {
    trigger: jest.fn()
  },
  data: {
    get: jest.fn()
  },
  request: {
    invokeTemplate: jest.fn()
  }
})

describe('TemplateRequestService', () => {
  let service: TemplateRequestService
  let mockClient: jest.Mocked<FreshdeskClient>

  beforeEach(() => {
    mockClient = createMockClient()
    service = new TemplateRequestService(mockClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create a service instance with the provided client', () => {
      const client = createMockClient()
      const serviceInstance = new TemplateRequestService(client)

      expect(serviceInstance).toBeInstanceOf(TemplateRequestService)
    })
  })

  describe('invoke', () => {
    const mockTemplateName = 'test-template'
    const mockContext = { key: 'value' }
    const mockBody = { data: 'test' }
    const mockOptions: TemplateRequestOptions = {
      cache: true,
      ttl: 3600,
      oauth: 'token123'
    }

    it('should successfully invoke template with minimal parameters', async () => {
      const mockResponse = { status: 200, response: '{"result": "success"}' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      const result = await service.invoke({
        templateName: mockTemplateName
      })

      expect(mockClient.request.invokeTemplate).toHaveBeenCalledWith(mockTemplateName, {
        context: undefined,
        options: undefined,
        body: undefined
      })
      expect(result).toEqual({ result: 'success' })
    })

    it('should successfully invoke template with all parameters', async () => {
      const mockResponse = { status: 200, response: '{"result": "success"}' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      const result = await service.invoke({
        templateName: mockTemplateName,
        context: mockContext,
        body: mockBody,
        options: mockOptions
      })

      expect(mockClient.request.invokeTemplate).toHaveBeenCalledWith(mockTemplateName, {
        context: mockContext,
        options: mockOptions,
        body: JSON.stringify(mockBody)
      })
      expect(result).toEqual({ result: 'success' })
    })

    it('should handle successful response with empty response body', async () => {
      const mockResponse = { status: 204, response: undefined }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      const result = await service.invoke({
        templateName: mockTemplateName
      })

      expect(result).toBeUndefined()
    })

    it('should handle successful response with null response body', async () => {
      const mockResponse = { status: 200, response: null }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      const result = await service.invoke({
        templateName: mockTemplateName
      })

      expect(result).toBeUndefined()
    })

    it('should handle successful response with empty string response body', async () => {
      const mockResponse = { status: 200, response: '' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      const result = await service.invoke({
        templateName: mockTemplateName
      })

      expect(result).toBeUndefined()
    })

    it('should throw TemplateRequestError for HTTP error status', async () => {
      const mockResponse = { status: 400, response: 'Bad Request' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockRejectedValue(mockResponse)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow(TemplateRequestError)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow('Template "test-template" failed: [400] Bad Request')
    })

    it('should throw TemplateRequestError for 500 status', async () => {
      const mockResponse = { status: 500, response: 'Internal Server Error' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockRejectedValue(mockResponse)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow('Template "test-template" failed: [500] Internal Server Error')
    })

    it('should throw TemplateRequestError when client throws an error', async () => {
      const clientError = new Error('Network error')
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockRejectedValue(clientError)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow(TemplateRequestError)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow('Template "test-template" failed: [undefined] undefined')
    })

    it('should handle JSON parsing errors gracefully', async () => {
      const mockResponse = { status: 200, response: 'invalid json' }
      const invokeTemplate = mockClient.request.invokeTemplate as jest.Mock
      invokeTemplate.mockResolvedValue(mockResponse)

      await expect(
        service.invoke({
          templateName: mockTemplateName
        })
      ).rejects.toThrow(TemplateRequestError)
    })
  })
})
