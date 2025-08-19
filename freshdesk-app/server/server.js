exports = {
  onAppInstallHandler: async function (payload) {
    console.log('onAppInstallHandler invoked with following data: \n', payload)

    try {
      const response = await $request.invokeTemplate('getHelpdeskAccount')

      const account = JSON.parse(response.response)
      if (account.id) {
        console.log('Helpdesk account already exists.', { id: account.id })
        renderData()
        return
      }
    } catch (error) {
      console.log('No helpdesk account found. Creating new one...')
    }

    try {
      await $request.invokeTemplate('createHelpdeskAccount', {
        body: JSON.stringify({
          subdomain: payload.currentHost.endpoint_urls.freshdesk.split('//')[1],
          api_key: payload.iparams.freshdeskApiKey,
          email: payload.iparams.email,
          provider: 'freshdesk',
          time_range: payload.iparams.historicalLookupWindow || 180
        })
      })
      renderData()
    } catch (error) {
      renderData({ message: 'Quivr API key or Freshdesk API key is incorrect.' })
    }
  },
  onSettingsUpdate: function (args) {
    console.log('onSettingsUpdate invoked with following data: \n', args)
    renderData()
  }
}
