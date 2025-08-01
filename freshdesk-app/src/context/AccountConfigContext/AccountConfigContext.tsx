import { createContext, useContext, useLayoutEffect, useState } from 'react'
import type { HelpdeskAccount } from '../../types/quivr'
import { useQuivrClient } from '../../hooks/useQuivrClient/useQuivrClient'

const AccountConfigContext = createContext<{ accountConfig: HelpdeskAccount | null }>({
  accountConfig: null
})

export const AccountConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { getHelpdeskAccount } = useQuivrClient()
  const [accountConfig, setAccountConfig] = useState<HelpdeskAccount | null>(null)

  useLayoutEffect(() => {
    const init = async () => {
      try {
        const account = await getHelpdeskAccount()
        setAccountConfig(account)
      } catch (error) {
        console.error('Failed to load account config:', error)
        setAccountConfig(null)
      }
    }

    init()
  }, [])

  return (
    <AccountConfigContext.Provider value={{ accountConfig: accountConfig }}>{children}</AccountConfigContext.Provider>
  )
}

export const useAccountConfigContext = () => {
  const accountConfig = useContext(AccountConfigContext)

  return accountConfig
}
