import { screen, render } from '@testing-library/react'
import App from './App'

// Mock the context to provide a client
jest.mock('./context/FreshdeskClientContext', () => ({
  useFreshdeskClient: jest.fn()
}))

jest.mock('@freshworks/crayons/react', () => require('../__mocks__/freshworks-crayons-react'))

test('renders the app with HelloUser component', () => {
  // Mock the context to return a client
  const { useFreshdeskClient } = require('./context/FreshdeskClientContext')
  useFreshdeskClient.mockReturnValue({
    // Mock client object
  })

  render(<App />)

  // Check for the button text
  const buttonElement = screen.getByText(/get helpdesk account/i)
  expect(buttonElement).toBeInTheDocument()

  // Check for the welcome text
  const welcomeText = screen.getByText(/welcome to your first react app in freshdesk/i)
  expect(welcomeText).toBeInTheDocument()
})

test('renders loading state when client is not available', () => {
  // Mock the context to return null client
  const { useFreshdeskClient } = require('./context/FreshdeskClientContext')
  useFreshdeskClient.mockReturnValue(null)

  render(<App />)

  const loadingElement = screen.getByText(/loading/i)
  expect(loadingElement).toBeInTheDocument()
})
