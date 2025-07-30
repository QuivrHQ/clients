import { useState } from 'react'
import { FwButton } from '@freshworks/crayons/react'
import styles from './HelloUser.module.scss'
import { useQuivrClient } from '../hooks/useQuivrClient'

const HelloUser: React.FC = () => {
  const [subdomain, setSubdomain] = useState('')
  const { getHelpdeskAccount } = useQuivrClient()

  return (
    <div>
      <FwButton
        color="primary"
        onFwClick={async () => {
          const response = await getHelpdeskAccount()
          setSubdomain(response.subdomain)
        }}
      >
        Get Helpdesk Account
      </FwButton>

      <h3 className={styles.text}>Hi {subdomain},</h3>
      <p>Welcome to your first react app in Freshdesk </p>
    </div>
  )
}

export default HelloUser
