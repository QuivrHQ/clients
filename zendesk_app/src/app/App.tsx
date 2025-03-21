import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'
import React from 'react'

import RightPanel from './components/RightPanelApp/RightPanelApp'

interface AppProps {
  isEditorMode?: boolean
}

function App({ isEditorMode = false }: AppProps) {
  return <ThemeProvider theme={{ ...DEFAULT_THEME }}>{isEditorMode ? <div>Hello</div> : <RightPanel />}</ThemeProvider>
}

export default App
