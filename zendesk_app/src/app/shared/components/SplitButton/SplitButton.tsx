import { type JSX, useEffect, useRef, useState } from 'react'

import { SplitButtonType } from '../../../types/button'

import styles from './SplitButton.module.scss'

import { Color } from '../../../types/colors'
import { ZendeskTask } from '../../../types/zendesk'
import { Icon } from '../Icon/Icon'

interface SplitButtonProps {
  color: Color
  size?: 'tiny' | 'small' | 'normal'
  important?: boolean
  splitButtons: SplitButtonType[]
  onSubmit: (action: ZendeskTask) => void
  disabled?: boolean
}

export const SplitButton = ({
  color,
  size = 'normal',
  splitButtons,
  important,
  onSubmit,
  disabled
}: SplitButtonProps): JSX.Element => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const splitButtonRef = useRef<HTMLDivElement>(null)
  const hasMultipleButtons = splitButtons.length > 1

  const handleToggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const defaultButtonClasses = `${styles.default_button} ${menuOpen ? styles.menu_open : ''} ${styles[color]} ${
    important ? styles.important : ''
  } ${styles[size]} ${disabled ? styles.disabled : ''} ${hasMultipleButtons ? styles.multiple_buttons : ''}`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (splitButtonRef.current && !splitButtonRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={splitButtonRef} className={styles.split_button_wrapper}>
      <div className={styles.button_and_dropdown_button}>
        <div
          className={defaultButtonClasses}
          onClick={() => {
            onSubmit(splitButtons[0].task)
          }}
        >
          <span className={styles.label}>{splitButtons[0].label}</span>
        </div>
        {hasMultipleButtons && (
          <div
            className={`${styles.icon_button_wrapper} ${styles[color]} ${styles[size]} ${menuOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
            onClick={handleToggleMenu}
          >
            <div className={styles.icon_button}>
              <Icon name="chevronDown" size="normal" color="white" />
            </div>
          </div>
        )}
      </div>
      {menuOpen && hasMultipleButtons && (
        <div className={styles.menu}>
          {splitButtons.slice(1).map((button, index) => (
            <div
              key={index}
              className={`${styles.menu_item} ${styles[color]} ${styles[size]} ${disabled ? styles.disabled : ''}`}
              onClick={() => {
                onSubmit(button.task)
                setMenuOpen(false)
              }}
            >
              <span className={styles.label}>{button.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SplitButton
