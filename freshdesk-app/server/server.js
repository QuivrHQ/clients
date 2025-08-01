exports = {
  onAppInstallHandler: function (payload) {
    console.log('Logging arguments from onAppInstallevent: ' + JSON.stringify(payload))
    // If the setup is successful
    renderData()
  },
  onSettingsUpdate: function (args) {
    // args is a JSON block containing the payload information
    // include logic to validate the app settings
    console.log('onSettingsUpdate invoked with following data: \n', args)
    renderData()
  }
}
