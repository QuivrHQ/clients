import { render, screen, fireEvent } from '@testing-library/react'
import HelloUser from './HelloUser'

jest.mock('@freshworks/crayons/react', () => require('../../__mocks__/freshworks-crayons-react'))

const mockGetHelpdeskAccount = jest.fn().mockResolvedValue({ subdomain: 'example' })

jest.mock('../hooks/useQuivrClient', () => ({
  useQuivrClient: () => ({
    getHelpdeskAccount: mockGetHelpdeskAccount
  })
}))

describe('HelloUser component', () => {
  it('fetches and displays the subdomain after button click', async () => {
    render(<HelloUser />)

    const button = screen.getByRole('button', { name: /get helpdesk account/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    const greeting = await screen.findByText(/Hi example,/i)
    expect(greeting).toBeInTheDocument()

    expect(mockGetHelpdeskAccount).toHaveBeenCalledTimes(1)
  })
})
