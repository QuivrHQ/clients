import React from 'react'

export function FwButton(props) {
  return (
    <button onClick={props.onFwClick} {...props}>
      {props.children}
    </button>
  )
}

export const FwTextarea = React.forwardRef(function FwTextarea(props, ref) {
  return <textarea {...props} ref={ref} onChange={() => {}} />
})
