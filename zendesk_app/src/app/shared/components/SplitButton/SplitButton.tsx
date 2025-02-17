import React, { type JSX, useEffect, useRef, useState } from 'react'

import { SplitButtonType } from '../../../types/button'

import styles from './SplitButton.module.scss'

import { Color } from '../../../types/colors'
import { Icon } from '../Icon/Icon'

interface SplitButtonProps {
  color: Color
  size?: 'tiny' | 'small' | 'normal'
  important?: boolean
  splitButtons: SplitButtonType[]
}

export const SplitButton = ({ color, size = 'normal', splitButtons, important }: SplitButtonProps): JSX.Element => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const splitButtonRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [iconButtonHovered, setIconButtonHovered] = useState<boolean>(false)

  const handleMouseEnter = (index: number) => setHoveredIndex(index)
  const handleMouseLeave = () => setHoveredIndex(null)

  const handleToggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const useIconColor = () => {
    if (hoveredIndex === -1 || important || iconButtonHovered) {
      return 'white'
    }
    return hoveredIndex === -1 || important ? 'white' : color
  }

  const iconColor = useIconColor()

  const defaultButtonClasses = `${styles.default_button} ${menuOpen ? styles.menu_open : ''} ${styles[color]} ${
    important ? styles.important : ''
  } ${styles[size]} ${splitButtons[0].disabled ? styles.disabled : ''}`

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
            void splitButtons[0].onClick()
          }}
        >
          <span className={styles.label}>{splitButtons[0].label}</span>
        </div>
        <div
          className={`${styles.icon_button} ${styles[color]} ${styles[size]} ${menuOpen ? styles.open : ''}`}
          onClick={handleToggleMenu}
          onMouseEnter={() => setIconButtonHovered(true)}
          onMouseLeave={() => setIconButtonHovered(false)}
        >
          <Icon name="chevronDown" size="normal" color={iconColor} />
        </div>
      </div>
      {menuOpen && (
        <div className={styles.menu}>
          {splitButtons.slice(1).map((button, index) => (
            <div
              key={index}
              className={`${styles.menu_item} ${styles[color]} ${styles[size]} ${button.disabled ? styles.disabled : ''}`}
              onClick={() => {
                void button.onClick()
                setMenuOpen(false)
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
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
