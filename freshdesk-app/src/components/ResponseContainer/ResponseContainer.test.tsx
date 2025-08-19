import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ResponseContainer from './ResponseContainer'
import { useQuivrClient } from '../../hooks/useQuivrClient/useQuivrClient'
import { useFreshdeskClient } from '../../context/FreshdeskClientContext/FreshdeskClientContext'
import { useAccountConfigContext } from '../../context/AccountConfigContext/AccountConfigContext'

// Mock the hooks
jest.mock('../../hooks/useQuivrClient/useQuivrClient')
jest.mock('../../context/FreshdeskClientContext/FreshdeskClientContext')
jest.mock('../../context/AccountConfigContext/AccountConfigContext')

// Mock Freshworks Crayons components using the existing mock
jest.mock('@freshworks/crayons/react', () => require('../../../__mocks__/freshworks-crayons-react'))

const mockGetAutodraft = jest.fn()
const mockClient = {
  data: {
    get: jest.fn()
  },
  interface: {
    trigger: jest.fn()
  }
}
const mockAccountConfig = {
  enable_autodraft_in_reply_box: false
}

describe('ResponseContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    ;(useQuivrClient as jest.Mock).mockReturnValue({
      getAutodraft: mockGetAutodraft
    })
    ;(useFreshdeskClient as jest.Mock).mockReturnValue(mockClient)
    ;(useAccountConfigContext as jest.Mock).mockReturnValue({
      accountConfig: mockAccountConfig
    })
  })

  it('renders without crashing', () => {
    render(<ResponseContainer />)
  })

  it('does not load draft when client is not available', async () => {
    ;(useFreshdeskClient as jest.Mock).mockReturnValue(null)

    render(<ResponseContainer />)

    await waitFor(() => {
      expect(mockClient.data.get).not.toHaveBeenCalled()
      expect(mockGetAutodraft).not.toHaveBeenCalled()
    })
  })

  it('does not load draft when accountConfig is not available', async () => {
    ;(useAccountConfigContext as jest.Mock).mockReturnValue({
      accountConfig: null
    })

    render(<ResponseContainer />)

    await waitFor(() => {
      expect(mockClient.data.get).not.toHaveBeenCalled()
      expect(mockGetAutodraft).not.toHaveBeenCalled()
    })
  })

  it('does not load draft when ticket is not available', async () => {
    const mockTicket = { ticket: null }

    mockClient.data.get.mockResolvedValue(mockTicket)

    render(<ResponseContainer />)

    await waitFor(() => {
      expect(mockClient.data.get).toHaveBeenCalledWith('ticket')
      expect(mockGetAutodraft).not.toHaveBeenCalled()
    })
  })

  it('automatically loads draft in reply box when enabled', async () => {
    const mockTicket = { ticket: { id: 123 } }
    const mockDraft = { generated_answer: 'Auto-draft content' }

    mockClient.data.get.mockResolvedValue(mockTicket)
    mockGetAutodraft.mockResolvedValue(mockDraft)
    ;(useAccountConfigContext as jest.Mock).mockReturnValue({
      accountConfig: { enable_autodraft_in_reply_box: true }
    })

    render(<ResponseContainer />)

    await waitFor(() => {
      expect(mockClient.interface.trigger).toHaveBeenCalledWith('click', {
        id: 'reply',
        text: 'Auto-draft content'
      })
    })
  })

  it('handles errors when loading draft in reply box', async () => {
    const mockTicket = { ticket: { id: 123 } }
    const mockDraft = { generated_answer: 'Auto-draft content' }

    mockClient.data.get.mockResolvedValue(mockTicket)
    mockGetAutodraft.mockResolvedValue(mockDraft)
    // Mock the first call to fail, subsequent calls to succeed
    mockClient.interface.trigger.mockRejectedValueOnce(new Error('Interface error')).mockResolvedValue(undefined)
    ;(useAccountConfigContext as jest.Mock).mockReturnValue({
      accountConfig: { enable_autodraft_in_reply_box: true }
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(<ResponseContainer />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Reply box already open, setting value', expect.any(Error))
      expect(mockClient.interface.trigger).toHaveBeenCalledTimes(2)
      expect(mockClient.interface.trigger).toHaveBeenNthCalledWith(1, 'click', {
        id: 'reply',
        text: 'Auto-draft content'
      })
      expect(mockClient.interface.trigger).toHaveBeenNthCalledWith(2, 'setValue', {
        id: 'editor',
        text: 'Auto-draft content',
        replace: true
      })
    })

    consoleSpy.mockRestore()
  })
})
