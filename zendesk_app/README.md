# Zendesk Quivr APP

This app allows you to refine your draft based on your macros or an initial draft, along with all conversations with your client. You can adjust the tone of the response to ensure your client has a pleasant interaction with your agents.

# Developper Quickstart 
To run the app locally as a dev, you need to create a ```zcli.apps.config.json``` with the following content : 

```
{
  "name": "Quivr",
  "id": "quivr_app",
  "parameters": {
    "quivr_api_key": "your_api_key"
  }
}
```

At the root of the file (/zendesk_app) you run ```zcli apps:server```;

Then you simply need to go to your zen desk account, click on a ticket and add at the end of the url : myzendeskurl **?zcli_apps=true**



