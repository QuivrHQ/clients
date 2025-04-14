import { DEFAULT_THEME, ThemeProvider } from '@zendeskgarden/react-theming'

import FeedbackModal from './components/FeedbackModal/FeedbackModal'
import { ReplyBoxApp } from './components/ReplyBoxApp/ReplyBoxApp'
import { RightPanelApp } from './components/RightPanelApp/RightPanelApp'

interface AppProps {
  isEditorMode?: boolean
  isDisplayedModal?: boolean
}

function App({ isEditorMode = false, isDisplayedModal = false }: AppProps) {
  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      {isDisplayedModal ? <FeedbackModal></FeedbackModal> : isEditorMode ? <ReplyBoxApp /> : <RightPanelApp />}
    </ThemeProvider>
  )
}

export default App
