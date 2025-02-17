export const useZendesk = () => {
  function getHistoric(client) {
    return client.get('ticket.comments').then((data) => {
      return data['ticket.comments'].map((comment) => comment.value)
    })
  }

  function getUserInput(client) {
    return client.get('ticket.comment').then((data) => data['ticket.comment'].text)
  }

  function getUserName(client) {
    return client.get('currentUser').then((data) => data.currentUser.name)
  }

  function getRequesterName(client) {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].name)
  }

  function getTicketId(client) {
    return client.get('ticket.id').then((data) => data['ticket.id'])
  }

  function getUserEmail(client) {
    return client.get('currentUser').then((data) => data.currentUser.email)
  }

  function getRequesterEmail(client) {
    return client.get('ticket.requester').then((data) => data['ticket.requester'].email)
  }

  function getSubdomain(client) {
    return client.context().then((context) => {
      return context.account.subdomain
    })
  }

  function pasteInEditor(client, reformulatedText) {
    return client.set('ticket.comment.text', reformulatedText)
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
