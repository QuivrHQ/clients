import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { FreshdeskProvider } from './context/FreshdeskClientContext/FreshdeskClientContext'

ReactDOM.render(
  <React.StrictMode>
    <FreshdeskProvider>
      <App />
    </FreshdeskProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
