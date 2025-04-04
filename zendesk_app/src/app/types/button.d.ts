import { iconList } from '../shared/helpers/iconList'
import { Color } from './colors'
import { ZendeskTask } from './zendesk'

export interface SplitButtonType {
  label: string
  iconName: keyof typeof iconList
  task: ZendeskTask
  displayKey: string
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
  disabled?: boolean
}
