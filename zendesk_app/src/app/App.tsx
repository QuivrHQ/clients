import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'

import { ReplyBoxApp } from './components/ReplyBoxApp/ReplyBoxApp'
import { RightPanelApp } from './components/RightPanelApp/RightPanelApp'
import { Modal } from './components/Modal/Modal'

interface AppProps {
  isEditorMode?: boolean
  isDisplayedModal?: boolean
}

function App({ isEditorMode = false, isDisplayedModal = false }: AppProps) {
  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      {isDisplayedModal ? <Modal /> : isEditorMode ? <ReplyBoxApp /> : <RightPanelApp />}
    </ThemeProvider>
  )
}

export default App
