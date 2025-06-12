import '@zendeskgarden/css-bedrock'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ClientProvider } from './contexts/ClientProvider.tsx'
import { QuivrApiProvider } from './contexts/QuivrApiProvider.tsx'
import { ExecuteZendeskTaskProvider } from './contexts/ExecuteZendeskTaskProvider.tsx'
import './index.css'

// Get the current URL to determine if we're in editor mode
const isEditorMode = window.location.pathname.includes('/editor')
const isDisplayedModal = window.location.pathname.includes('/modal')

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClientProvider>
    <QuivrApiProvider>
      <ExecuteZendeskTaskProvider>
        <App isEditorMode={isEditorMode} isDisplayedModal={isDisplayedModal} />
      </ExecuteZendeskTaskProvider>
    </QuivrApiProvider>
  </ClientProvider>
)
