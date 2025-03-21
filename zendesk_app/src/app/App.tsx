import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'
import React from 'react'

import { ReplyBoxApp } from './components/ReplyBoxApp/ReplyBoxApp'
import { RightPanelApp } from './components/RightPanelApp/RightPanelApp'

interface AppProps {
  isEditorMode?: boolean
}

function App({ isEditorMode = false }: AppProps) {
  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>{isEditorMode ? <ReplyBoxApp /> : <RightPanelApp />}</ThemeProvider>
  )
}

export default App
