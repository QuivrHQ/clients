import React, { type JSX } from 'react'

import { SplitButtonType } from '../../../types/button'
import styles from './ActionButton.module.scss'

interface ActionButtonProps {
  button: SplitButtonType
}

export const ActionButton = ({ button }: ActionButtonProps): JSX.Element => {
  return (
    <div className={styles.content_container} onClick={button.onClick}>
      <span>{button.label}</span>
    </div>
  )
}

export default ActionButton
