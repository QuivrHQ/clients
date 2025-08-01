import HelloUser from './components/HelloUser'
import { useFreshdeskClient } from './context/FreshdeskClientContext'
import './index.css'

const App = () => {
  const client = useFreshdeskClient()

  if (!client) {
    return <div>Loading...</div>
  }

  return <HelloUser />
}

export default App
