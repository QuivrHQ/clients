import { renderHook } from '@testing-library/react-hooks'
import { useQuivrClient } from './useQuivrClient'
import { TemplateRequestService } from '../../services/template-request'
import type { HelpdeskAccount, Autodraft } from '../../types/quivr'
import type { FreshdeskClient } from '../../types/freshdesk'

// Mock the TemplateRequestService
jest.mock('../../services/template-request')

// Mock the FreshdeskClientContext
jest.mock('../../context/FreshdeskClientContext/FreshdeskClientContext', () => ({
  useFreshdeskClient: jest.fn()
}))

const mockUseFreshdeskClient = require('../../context/FreshdeskClientContext/FreshdeskClientContext').useFreshdeskClient

describe('useQuivrClient', () => {
  let mockClient: FreshdeskClient
  let mockRequestService: jest.Mocked<TemplateRequestService>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock client
    mockClient = {
      data: {
        get: jest.fn()
      },
      interface: {
        trigger: jest.fn()
      },
      request: {
        invokeTemplate: jest.fn()
      }
    } as unknown as FreshdeskClient

    // Create mock request service
    mockRequestService = {
      invoke: jest.fn()
    } as unknown as jest.Mocked<TemplateRequestService>

    // Mock the TemplateRequestService constructor
    ;(TemplateRequestService as jest.MockedClass<typeof TemplateRequestService>).mockImplementation(
      () => mockRequestService
    )

    // Mock the useFreshdeskClient hook
    mockUseFreshdeskClient.mockReturnValue(mockClient)
  })

  describe('getHelpdeskAccount', () => {
    it('should call the template service with correct parameters', async () => {
      const mockAccount: HelpdeskAccount = {
        id: 'test-id',
        email: 'test@example.com',
        subdomain: 'test-subdomain',
        api_key: 'test-api-key',
        workspace_id: 'test-workspace',
        time_range: 30,
        triggers_id: ['trigger1'],
        webhook_id: 'webhook1',
        helpdesk_brains: ['brain1'],
        brain_links: ['link1'],
        external_endpoints: ['endpoint1'],
        ticket_fields: {},
        user_fields: {},
        tags: ['tag1'],
        provider: 'freshdesk',
        display_generate_button: true,
        display_translate_button: false,
        display_summarize_button: true,
        display_reformulate_button: false,
        display_iterate_button: true,
        display_correct_button: false,
        enable_autodraft_in_reply_box: true,
        autosend_enabled: false,
        daily_autosend_limit: 10,
        question_categories: {}
      }

      mockRequestService.invoke.mockResolvedValue(mockAccount)

      const { result } = renderHook(() => useQuivrClient())

      const account = await result.current.getHelpdeskAccount()

      expect(mockRequestService.invoke).toHaveBeenCalledWith({
        templateName: 'getHelpdeskAccount'
      })
      expect(account).toEqual(mockAccount)
    })

    it('should throw error when template service fails', async () => {
      const error = new Error('Template service error')
      mockRequestService.invoke.mockRejectedValue(error)

      const { result } = renderHook(() => useQuivrClient())

      await expect(result.current.getHelpdeskAccount()).rejects.toThrow('Template service error')
      expect(mockRequestService.invoke).toHaveBeenCalledWith({
        templateName: 'getHelpdeskAccount'
      })
    })
  })

  describe('getAutodraft', () => {
    it('should call the template service with correct parameters', async () => {
      const mockAutodraft: Autodraft = {
        ticket_answer_id: 'answer-123',
        generated_answer: 'This is a generated response',
        prediction: {
          prediction_id: 'pred-456',
          confidence_score: 0.95,
          is_autosendable: true,
          is_accepted: null
        }
      }

      mockRequestService.invoke.mockResolvedValue(mockAutodraft)

      const { result } = renderHook(() => useQuivrClient())

      const autodraft = await result.current.getAutodraft('ticket-123')

      expect(mockRequestService.invoke).toHaveBeenCalledWith({
        templateName: 'getAutodraft',
        context: {
          ticket_id: 'ticket-123'
        }
      })
      expect(autodraft).toEqual(mockAutodraft)
    })

    it('should call the template service with different ticket ID', async () => {
      const mockAutodraft: Autodraft = {
        ticket_answer_id: 'answer-789',
        generated_answer: 'Another generated response'
      }

      mockRequestService.invoke.mockResolvedValue(mockAutodraft)

      const { result } = renderHook(() => useQuivrClient())

      const autodraft = await result.current.getAutodraft('ticket-789')

      expect(mockRequestService.invoke).toHaveBeenCalledWith({
        templateName: 'getAutodraft',
        context: {
          ticket_id: 'ticket-789'
        }
      })
      expect(autodraft).toEqual(mockAutodraft)
    })

    it('should throw error when template service fails', async () => {
      const error = new Error('Autodraft service error')
      mockRequestService.invoke.mockRejectedValue(error)

      const { result } = renderHook(() => useQuivrClient())

      await expect(result.current.getAutodraft('ticket-123')).rejects.toThrow('Autodraft service error')
      expect(mockRequestService.invoke).toHaveBeenCalledWith({
        templateName: 'getAutodraft',
        context: {
          ticket_id: 'ticket-123'
        }
      })
    })
  })

  describe('TemplateRequestService instantiation', () => {
    it('should create TemplateRequestService with the correct client', () => {
      renderHook(() => useQuivrClient())

      expect(TemplateRequestService).toHaveBeenCalledWith(mockClient)
    })

    it('should create TemplateRequestService only once per client', () => {
      const { rerender } = renderHook(() => useQuivrClient())

      // Re-render with same client
      rerender()

      expect(TemplateRequestService).toHaveBeenCalledTimes(1)
    })

    it('should create new TemplateRequestService when client changes', () => {
      const { rerender } = renderHook(() => useQuivrClient())

      // Change the client
      const newMockClient = { ...mockClient }
      mockUseFreshdeskClient.mockReturnValue(newMockClient)
      rerender()

      expect(TemplateRequestService).toHaveBeenCalledTimes(2)
      expect(TemplateRequestService).toHaveBeenCalledWith(newMockClient)
    })
  })

  describe('return value structure', () => {
    it('should return an object with getHelpdeskAccount and getAutodraft methods', () => {
      const { result } = renderHook(() => useQuivrClient())

      expect(result.current).toHaveProperty('getHelpdeskAccount')
      expect(result.current).toHaveProperty('getAutodraft')
      expect(typeof result.current.getHelpdeskAccount).toBe('function')
      expect(typeof result.current.getAutodraft).toBe('function')
    })
  })
})
