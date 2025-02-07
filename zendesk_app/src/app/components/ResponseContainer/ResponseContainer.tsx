import React, { type JSX } from 'react'

import styles from './ResponseContainer.module.scss'
interface ResponseContainerProps {
  responseContent: string
}

export const ResponseContainer = ({ responseContent }: ResponseContainerProps): JSX.Element => {
  return (
    <div
      className={styles.response_container}
      contentEditable={true}
      dangerouslySetInnerHTML={{ __html: responseContent }}
    ></div>
  )
}

export default ResponseContainer
