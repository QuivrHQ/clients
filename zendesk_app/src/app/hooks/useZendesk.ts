import { ZAFClient } from '../contexts/ClientProvider'
import { ZendeskConversationEntry, ZendeskUser } from '../types/zendesk'

export const useZendesk = () => {
  async function getHistoric(client: ZAFClient): Promise<string[]> {
    return client.get('ticket.comments').then((data) => {
      return data['ticket.comments'].map((comment: { value: string }) => comment.value)
    })
  }

  async function getUserInput(client: ZAFClient): Promise<string> {
    return client.get('ticket.comment').then((data) => data['ticket.comment'].text)
  }

  async function setCommentType(client: ZAFClient, commentType: 'publicReply' | 'internalNote'): Promise<void> {
    return client.set('ticket.comment.type', commentType)
  }

  async function setUserInput(client: ZAFClient, commentText: string): Promise<void> {
    return client.set('ticket.comment.text', commentText, { html: true })
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

  async function getLatestEndUserMessage(client: ZAFClient): Promise<ZendeskConversationEntry | null> {
    const data = await client.get('ticket.conversation');
    const conversation = data['ticket.conversation'];
  
    if (!Array.isArray(conversation)) return null;
  
    const latestMessage = conversation
      .filter(msg => msg.author.role === 'end-user' && msg.message?.content)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
    return latestMessage || null;
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

  async function getSubdomain(client: ZAFClient): Promise<string> {
    return client.context().then((context) => {
      return context.account.subdomain
    })
  }

  async function sendMessage(client: ZAFClient, message: string): Promise<void> {
    const ticketId = await getTicketId(client)
    await client.request({
      url: `/api/v2/tickets/${ticketId}.json`,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({
        ticket: {
          comment: {
            body: message,
            public: true
          }
        }
      })
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
    setCommentType,
    setUserInput,
    pasteInEditor,
    sendMessage,
    getLatestEndUserMessage
  }
}
