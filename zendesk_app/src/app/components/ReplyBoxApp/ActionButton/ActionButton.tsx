import React, { type JSX } from 'react'

import { Icon } from '../../../shared/components/Icon/Icon'
import { SplitButtonType } from '../../../types/button'
import styles from './ActionButton.module.scss'

interface ActionButtonProps {
  button: SplitButtonType
}

export const ActionButton = ({ button }: ActionButtonProps): JSX.Element => {
  return (
    <div className={styles.content_container} onClick={() => button.onClick()}>
      <span>{button.label}</span>
      <Icon name={button.iconName} color="white" size="normal" />
    </div>
  )
}

export default ActionButton
