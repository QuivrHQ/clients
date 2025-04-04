import React, { type JSX } from 'react'
import { ZendeskTask } from '../../../types/zendesk'
import { Icon } from '../../../shared/components/Icon/Icon'
import { SplitButtonType } from '../../../types/button'
import styles from './ActionButton.module.scss'

interface ActionButtonProps {
  button: SplitButtonType
  onClick: (action: ZendeskTask) => void
}

export const ActionButton = ({ button, onClick }: ActionButtonProps): JSX.Element => {
  return (
    <div className={styles.content_container} onClick={() => onClick(button.task)}>
      <span>{button.label}</span>
      <Icon name={button.iconName} color="white" size="normal" />
    </div>
  )
}

export default ActionButton
