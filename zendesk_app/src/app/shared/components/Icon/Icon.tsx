import React, { type JSX, useEffect, useState } from 'react'
import { IconBaseProps } from 'react-icons/lib'

import { iconList } from '../../../shared/helpers/iconList'
import { Color } from '../../../types/colors'
import { IconSize } from '../../../types/iconSize'

import styles from './Icon.module.scss'

interface IconProps {
  name: keyof typeof iconList
  size: IconSize
  color?: Color
  customColor?: string
  disabled?: boolean
  classname?: string
  hovered?: boolean
  handleHover?: boolean
  onClick?: (event?: React.MouseEvent<SVGElement>) => void | Promise<void>
}

export const Icon = ({
  name,
  size,
  color,
  customColor,
  classname,
  disabled,
  hovered,
  handleHover,
  onClick
}: IconProps): JSX.Element => {
  const [iconHovered, setIconHovered] = useState(false)
  const IconComponent: React.ComponentType<IconBaseProps> = iconList[name]

  useEffect(() => {
    if (!handleHover) {
      setIconHovered(!!hovered)
    }
  }, [hovered, handleHover])

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (handleHover) {
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
      setIconHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (handleHover) {
      setIconHovered(false)
    }
  }

  return (
    <IconComponent
      className={`
        ${classname}
        ${styles[size]}
        ${!customColor && color ? styles[color] : ''}
        ${disabled ? styles.disabled : ''}
        ${iconHovered || hovered ? styles.hovered : ''}
      `}
      style={{ color: customColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(event) => void onClick?.(event)}
    />
  )
}
