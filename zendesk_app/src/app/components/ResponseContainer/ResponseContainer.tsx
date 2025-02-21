import React, { type JSX } from 'react'

import styles from './ResponseContainer.module.scss'

interface ResponseContainerProps {
  responseContent: string
  setResponseContent: (content: string) => void
}

export const ResponseContainer = ({ responseContent, setResponseContent }: ResponseContainerProps): JSX.Element => {
  const handleBlur = (event: React.FormEvent<HTMLDivElement>) => {
    setResponseContent(event.currentTarget.innerText)
  }

  return (
    <div
      className={styles.response_container}
      contentEditable={true}
      dangerouslySetInnerHTML={{ __html: responseContent }}
      onBlur={handleBlur}
    ></div>
  )
}

export default ResponseContainer
