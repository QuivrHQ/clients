import { iconList } from '../shared/helpers/iconList'
import { Color } from './colors'

export interface SplitButtonType {
  label: string
  iconName: keyof typeof iconList
  onClick: (event?: MouseEvent) => void | Promise<void>
  disabled?: boolean
}

export interface ButtonType {
  label: string
  color: Color
  isLoading?: boolean
  iconName?: keyof typeof iconList
  onClick?: (event?: MouseEvent) => void | Promise<void>
  important?: boolean
  size?: 'tiny' | 'small' | 'normal'
  tooltip?: string
}
