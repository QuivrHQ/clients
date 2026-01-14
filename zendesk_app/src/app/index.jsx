import '@zendeskgarden/css-bedrock'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import { ClientProvider } from './contexts/ClientProvider.tsx'
import { QuivrApiProvider } from './contexts/QuivrApiProvider.tsx'
import { ExecuteZendeskTaskProvider } from './contexts/ExecuteZendeskTaskProvider.tsx'
import { PostHogProvider } from 'posthog-js/react'

import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({
      levels: ['error']
    }),
    Sentry.consoleLoggingIntegration({ levels: ['error'] })
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  environment: import.meta.env.VITE_ENVIRONMENT,
  release: import.meta.env.VITE_SENTRY_RELEASE || 'zendesk-app@development',
  enableLogs: true
})

// Get the current URL to determine if we're in editor mode
const isEditorMode = window.location.pathname.includes('/editor')
const isDisplayedModal = window.location.pathname.includes('/modal')

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_KEY} options={options}>
    <ClientProvider>
      <QuivrApiProvider>
        <ExecuteZendeskTaskProvider>
          <App isEditorMode={isEditorMode} isDisplayedModal={isDisplayedModal} />
        </ExecuteZendeskTaskProvider>
      </QuivrApiProvider>
    </ClientProvider>
  </PostHogProvider>
)
