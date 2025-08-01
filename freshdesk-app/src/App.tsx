import ResponseContainer from './components/ResponseContainer/ResponseContainer'
import { AccountConfigProvider } from './context/AccountConfigContext/AccountConfigContext'
import { useFreshdeskClient } from './context/FreshdeskClientContext/FreshdeskClientContext'
import './index.css'

const App = () => {
  const client = useFreshdeskClient()

  if (!client) {
    return <div>Loading...</div>
  }

  return (
    <AccountConfigProvider>
      <ResponseContainer />
    </AccountConfigProvider>
  )
}

export default App
