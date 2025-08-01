import { screen, render } from '@testing-library/react'
import App from './App'

// Mock the context to provide a client
jest.mock('./context/FreshdeskClientContext/FreshdeskClientContext', () => ({
  useFreshdeskClient: jest.fn()
}))

jest.mock('@freshworks/crayons/react', () => require('../__mocks__/freshworks-crayons-react'))

// Mock ResponseContainer component
jest.mock('./components/ResponseContainer/ResponseContainer', () => {
  return function MockResponseContainer() {
    return 'MOCK_RESPONSE_CONTAINER'
  }
})

// Mock AccountConfigContext
jest.mock('./context/AccountConfigContext/AccountConfigContext', () => ({
  AccountConfigProvider: ({ children }: { children: any }) => children
}))

test('renders App component', () => {
  const { useFreshdeskClient } = require('./context/FreshdeskClientContext/FreshdeskClientContext')
  useFreshdeskClient.mockReturnValue({})

  render(<App />)

  expect(screen.getByText('MOCK_RESPONSE_CONTAINER')).toBeInTheDocument()
})
