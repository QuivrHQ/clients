*Use of this software is subject to important terms and conditions as set forth in the License file*

# Quivr Zendesk App.

This is the Quivr Zendesk App. It is a React application that is used to interact with the Quivr API.

## Installation

```bash
npm install
```

## Running the app

```bash
npm run dev

npm run start
```

Don't forget to change in manifest.json -> 'assets/index.html' -> 'http://localhost:3000'
And in `quivr.ts` change the {{setting.quivr_api_token}} to your Quivr API Token. and the {{setting.zendesk_api_key}} to your Zendesk API key.

## Building the app

```bash
npm run build
```

## Deploying the app

```bash
zcli apps:update
```

