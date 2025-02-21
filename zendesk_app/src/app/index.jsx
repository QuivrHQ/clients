import '@zendeskgarden/css-bedrock'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ClientProvider } from './contexts/ClientProvider.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClientProvider>
    <App />
  </ClientProvider>
)
