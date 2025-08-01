import React from 'react'

export function FwButton(props) {
  return (
    <button onClick={props.onFwClick} {...props}>
      {props.children}
    </button>
  )
}
