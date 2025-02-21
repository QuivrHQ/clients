import React, { type JSX, useState } from 'react'

import { ButtonType } from '../../../types/button'

import styles from './QuivrButton.module.scss'

import { Icon } from '../Icon/Icon'
import { LoaderIcon } from '../LoaderIcon/LoaderIcon'

export const QuivrButton = ({
  onClick,
  label,
  color,
  isLoading,
  iconName = undefined,
  disabled,
  important,
  size = 'normal'
}: ButtonType): JSX.Element => {
  const [hovered, setHovered] = useState<boolean>(false)

  const handleMouseEnter = () => setHovered(true)
  const handleMouseLeave = () => setHovered(false)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.nativeEvent.stopImmediatePropagation()
    if (!disabled) {
      void onClick?.()
    }
  }

  const useIconColor = () => {
    if ((hovered && !disabled) || (important && !disabled)) {
      return 'white'
    }
    if (disabled) {
      return 'grey'
    }

    return color
  }

  const iconColor = useIconColor()

  const buttonClasses = `${styles.button_wrapper} ${styles[color]} ${
    !iconName ? styles.without_icon : ''
  }  ${important ? styles.important : ''} ${disabled ? styles.disabled : ''} ${styles[size]}`

  return (
    <div
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.icon_label}>
        {!isLoading ? (
          iconName && <Icon classname={styles.icon} name={iconName} size={size} color={iconColor} handleHover={false} />
        ) : (
          <LoaderIcon color={iconColor} size={size} />
        )}
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  )
}

export default QuivrButton
