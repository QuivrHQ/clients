export const useZendesk = () => {
  function getHistoric(client) {
    return client.get('ticket.comments').then(function (data) {
      const comments = data['ticket.comments'].map((comment) => comment.value)
      return comments
    })
  }

  function getUserInput(client) {
    return client.get('ticket.comment').then(function (data) {
      return data['ticket.comment'].text
    })
  }

  function getUserName(client) {
    return client.get('currentUser').then(function (data) {
      return data.currentUser.name
    })
  }

  function getRequesterName(client) {
    return client.get('ticket.requester').then(function (data) {
      return data['ticket.requester'].name
    })
  }

  function pasteInEditor(client, reformulatedText) {
    return client.set('ticket.comment.text', reformulatedText)
  }

  return { getHistoric, getUserInput, getUserName, getRequesterName, pasteInEditor }
}
