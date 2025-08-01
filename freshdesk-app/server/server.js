exports = {
  onAppInstallHandler: async function (payload) {
    console.log('onAppInstallHandler invoked with following data: \n', payload)
    try {
      const response = await $request.invokeTemplate('createHelpdeskAccount', {
        body: JSON.stringify({
          subdomain: payload.currentHost.endpoint_urls.freshdesk.split('//')[1],
          api_key: payload.iparams.freshdeskApiKey,
          email: payload.iparams.email,
          provider: 'freshdesk',
          time_range: payload.iparams.historicalLookupWindow || 180
        })
      })
      console.log('Helpdesk account created successfully: \n', response)
      renderData()
    } catch (error) {
      console.error('Error creating helpdesk account: \n', error)
      renderData({ message: 'Failed to create helpdesk account' })
    }
  },
  onSettingsUpdate: function (args) {
    console.log('onSettingsUpdate invoked with following data: \n', args)
    renderData()
  }
}
