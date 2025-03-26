import '@zendeskgarden/css-bedrock'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ClientProvider } from './contexts/ClientProvider.tsx'
import './index.css'

// Get the current URL to determine if we're in editor mode
const isEditorMode = window.location.pathname.includes('/editor');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClientProvider>
    <App isEditorMode={isEditorMode} />
  </ClientProvider>
)
