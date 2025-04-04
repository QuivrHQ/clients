import { ZAFClient } from '../contexts/ClientProvider'

export const useZendesk = () => {
  function getHistoric(client: ZAFClient): Promise<string[]> {
    return client.get('ticket.comments').then((data) => {
      return data['ticket.comments'].map((comment: { value: string }) => comment.value)
    })
  }

  function getUserInput(client: ZAFClient): Promise<string> {
    return client.get('ticket.comment').then((data) => data['ticket.comment'].text)
  }

  function getUserName(client: ZAFClient): Promise<string> {
    return client.get('currentUser').then((data) => data.currentUser.name)
  }

  function getRequesterName(client: ZAFClient): Promise<string> {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].name)
  }

  function getTicketId(client: ZAFClient): Promise<string> {
    return client.get('ticket.id').then((data) => data['ticket.id'])
  }

  function getUserEmail(client: ZAFClient): Promise<string> {
    return client.get('currentUser').then((data) => data.currentUser.email)
  }

  function getRequesterEmail(client: ZAFClient): Promise<string> {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].email)
  }

  function getSubdomain(client: ZAFClient): Promise<string> {
    return client.context().then((context) => {
      return context.account.subdomain
    })
  }

  function pasteInEditor(client: ZAFClient, reformulatedText: string): Promise<void> {
    return client.set('ticket.comment.text', reformulatedText, { html: true })
  }

  return {
    getHistoric,
    getUserInput,
    getUserName,
    getRequesterName,
    getTicketId,
    getUserEmail,
    getRequesterEmail,
    getSubdomain,
    pasteInEditor
  }
}
