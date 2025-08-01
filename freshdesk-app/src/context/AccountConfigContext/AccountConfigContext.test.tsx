import { render, screen, waitFor } from '@testing-library/react'
import { AccountConfigProvider, useAccountConfigContext } from './AccountConfigContext'
import type { HelpdeskAccount } from '../../types/quivr'

// Mock the useQuivrClient hook
jest.mock('../../hooks/useQuivrClient/useQuivrClient', () => ({
  useQuivrClient: jest.fn()
}))

const mockUseQuivrClient = require('../../hooks/useQuivrClient/useQuivrClient').useQuivrClient as jest.Mock

describe('AccountConfigContext', () => {
  const mockHelpdeskAccount: HelpdeskAccount = {
    id: 'test-account-id',
    email: 'test@example.com',
    subdomain: 'test-subdomain',
    api_key: 'test-api-key',
    workspace_id: 'test-workspace-id',
    time_range: 30,
    triggers_id: ['trigger-1', 'trigger-2'],
    webhook_id: 'webhook-id',
    helpdesk_brains: ['brain-1'],
    brain_links: ['brain-link-1'],
    external_endpoints: ['endpoint-1'],
    ticket_fields: { field1: 'value1' },
    user_fields: { userField1: 'userValue1' },
    tags: ['tag1', 'tag2'],
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
    question_categories: { category1: 'value1' }
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('AccountConfigProvider', () => {
    it('should provide account config when getHelpdeskAccount succeeds', async () => {
      // Arrange
      const mockGetHelpdeskAccount = jest.fn().mockResolvedValue(mockHelpdeskAccount)
      mockUseQuivrClient.mockReturnValue({
        getHelpdeskAccount: mockGetHelpdeskAccount
      })

      // Consumer component to test the context
      const Consumer = () => {
        const { accountConfig } = useAccountConfigContext()
        return (
          <div>
            {accountConfig ? (
              <div>
                <span data-testid="account-id">{accountConfig.id}</span>
                <span data-testid="account-email">{accountConfig.email}</span>
                <span data-testid="account-subdomain">{accountConfig.subdomain}</span>
              </div>
            ) : (
              <span data-testid="loading">Loading...</span>
            )}
          </div>
        )
      }

      // Act
      render(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Assert - initially should show loading
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Wait for the account config to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('account-id')).toBeInTheDocument()
      })

      expect(screen.getByTestId('account-id')).toHaveTextContent('test-account-id')
      expect(screen.getByTestId('account-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('account-subdomain')).toHaveTextContent('test-subdomain')

      // Verify the hook was called
      expect(mockGetHelpdeskAccount).toHaveBeenCalledTimes(1)
    })

    it('should provide null account config when getHelpdeskAccount returns null', async () => {
      // Arrange
      const mockGetHelpdeskAccount = jest.fn().mockResolvedValue(null)
      mockUseQuivrClient.mockReturnValue({
        getHelpdeskAccount: mockGetHelpdeskAccount
      })

      // Consumer component to test the context
      const Consumer = () => {
        const { accountConfig } = useAccountConfigContext()
        return (
          <div>
            {accountConfig ? (
              <span data-testid="has-config">Has Config</span>
            ) : (
              <span data-testid="no-config">No Config</span>
            )}
          </div>
        )
      }

      // Act
      render(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Wait for the context to be initialized
      await waitFor(() => {
        expect(screen.getByTestId('no-config')).toBeInTheDocument()
      })

      expect(screen.getByTestId('no-config')).toBeInTheDocument()
      expect(screen.queryByTestId('has-config')).not.toBeInTheDocument()
    })

    it('should handle errors from getHelpdeskAccount gracefully', async () => {
      // Arrange
      const mockGetHelpdeskAccount = jest.fn().mockRejectedValue(new Error('API Error'))
      mockUseQuivrClient.mockReturnValue({
        getHelpdeskAccount: mockGetHelpdeskAccount
      })

      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Consumer component to test the context
      const Consumer = () => {
        const { accountConfig } = useAccountConfigContext()
        return (
          <div>
            {accountConfig ? (
              <span data-testid="has-config">Has Config</span>
            ) : (
              <span data-testid="no-config">No Config</span>
            )}
          </div>
        )
      }

      // Act
      render(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Wait for the context to be initialized (should remain null due to error)
      await waitFor(
        () => {
          expect(screen.getByTestId('no-config')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByTestId('no-config')).toBeInTheDocument()
      expect(screen.queryByTestId('has-config')).not.toBeInTheDocument()

      // Verify that the error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load account config:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })

    it('should only call getHelpdeskAccount once on mount', async () => {
      // Arrange
      const mockGetHelpdeskAccount = jest.fn().mockResolvedValue(mockHelpdeskAccount)
      mockUseQuivrClient.mockReturnValue({
        getHelpdeskAccount: mockGetHelpdeskAccount
      })

      // Consumer component
      const Consumer = () => {
        const { accountConfig } = useAccountConfigContext()
        return <div>{accountConfig ? 'Loaded' : 'Loading'}</div>
      }

      // Act
      const { rerender } = render(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument()
      })

      // Re-render the component
      rerender(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Assert that getHelpdeskAccount was only called once
      expect(mockGetHelpdeskAccount).toHaveBeenCalledTimes(1)
    })
  })

  describe('useAccountConfigContext', () => {
    it('should return default context value when used outside of AccountConfigProvider', () => {
      // Arrange
      const Consumer = () => {
        const context = useAccountConfigContext()
        return (
          <div>
            <span data-testid="context-keys">{Object.keys(context).join(',')}</span>
            <span data-testid="account-config-exists">{context.accountConfig ? 'true' : 'false'}</span>
          </div>
        )
      }

      // Act
      render(<Consumer />)

      // Assert - should return default context value
      expect(screen.getByTestId('context-keys')).toHaveTextContent('accountConfig')
      expect(screen.getByTestId('account-config-exists')).toHaveTextContent('false')
    })

    it('should return the correct context value when used within provider', async () => {
      // Arrange
      const mockGetHelpdeskAccount = jest.fn().mockResolvedValue(mockHelpdeskAccount)
      mockUseQuivrClient.mockReturnValue({
        getHelpdeskAccount: mockGetHelpdeskAccount
      })

      // Consumer component that uses the hook
      const Consumer = () => {
        const context = useAccountConfigContext()
        return (
          <div>
            <span data-testid="context-keys">{Object.keys(context).join(',')}</span>
            <span data-testid="account-config-exists">{context.accountConfig ? 'true' : 'false'}</span>
          </div>
        )
      }

      // Act
      render(
        <AccountConfigProvider>
          <Consumer />
        </AccountConfigProvider>
      )

      // Wait for the context to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('account-config-exists')).toHaveTextContent('true')
      })

      // Assert
      expect(screen.getByTestId('context-keys')).toHaveTextContent('accountConfig')
      expect(screen.getByTestId('account-config-exists')).toHaveTextContent('true')
    })
  })
})
