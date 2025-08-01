import { render, screen } from '@testing-library/react'
import { FreshdeskProvider, useFreshdeskClient } from './FreshdeskClientContext'

jest.mock('../../hooks/useScript/useScript', () => ({
  __esModule: true,
  default: jest.fn()
}))

const mockUseScript = require('../../hooks/useScript/useScript').default as jest.Mock

describe('FreshdeskProvider / useFreshdeskClient', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('provides the Freshdesk client once the SDK is loaded and initialised', async () => {
    // Arrange
    const mockClient = {
      instance: {
        resize: jest.fn()
      }
    }

    // Simulate the SDK script being loaded immediately
    mockUseScript.mockReturnValue(true)

    // Mock the global `app` object expected by Freshdesk SDK
    ;(global as any).app = {
      initialized: jest.fn().mockResolvedValue(mockClient)
    }

    // Consumer component to read the client from context
    const Consumer = () => {
      const client = useFreshdeskClient()
      return <div>{client ? 'CLIENT_READY' : 'NO_CLIENT'}</div>
    }

    // Act
    render(
      <FreshdeskProvider>
        <Consumer />
      </FreshdeskProvider>
    )

    // Assert – initially client should be null
    expect(screen.getByText('NO_CLIENT')).toBeInTheDocument()

    // Wait for context to update after app.initialized resolves
    const readyEl = await screen.findByText('CLIENT_READY')
    expect(readyEl).toBeInTheDocument()

    // Ensure app.initialized was called once
    expect((global as any).app.initialized).toHaveBeenCalledTimes(1)
  })
})
