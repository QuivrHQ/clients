import { ZAFClient } from '../contexts/ClientProvider'
import { ZendeskUser } from '../types/zendesk'

export const useZendesk = () => {
  async function getHistoric(client: ZAFClient): Promise<string[]> {
    return client.get('ticket.comments').then((data) => {
      return data['ticket.comments'].map((comment: { value: string }) => comment.value)
    })
  }

  async function getUserInput(client: ZAFClient): Promise<string> {
    return client.get('ticket.comment').then((data) => data['ticket.comment'].text)
  }

  async function getUserName(client: ZAFClient): Promise<string> {
    return client.get('currentUser').then((data) => data.currentUser.name)
  }

  async function getUser(client: ZAFClient): Promise<ZendeskUser> {
    return client.get('currentUser').then((data) => data.currentUser)
  }

  async function getRequesterName(client: ZAFClient): Promise<string> {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].name)
  }

  async function getTicketId(client: ZAFClient): Promise<string> {
    return client.get('ticket.id').then((data) => data['ticket.id'])
  }

  async function getUserEmail(client: ZAFClient): Promise<string> {
    return client.get('currentUser').then((data) => data.currentUser.email)
  }

  async function getRequesterEmail(client: ZAFClient): Promise<string> {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].email)
  }

  async function getAssignee(client: ZAFClient): Promise<ZendeskUser> {
    return client.get('ticket.assignee.user').then((data) => data['ticket.assignee.user'])
  }

  async function getSubdomain(client: ZAFClient): Promise<string> {
    return client.context().then((context) => {
      return context.account.subdomain
    })
  }

  async function pasteInEditor(client: ZAFClient, reformulatedText: string): Promise<void> {
    return client.set('ticket.comment.text', reformulatedText, { html: true })
  }

  return {
    getHistoric,
    getUserInput,
    getUserName,
    getUser,
    getRequesterName,
    getTicketId,
    getUserEmail,
    getRequesterEmail,
    getSubdomain,
    pasteInEditor,
    getAssignee
  }
}
