import { useState, useLayoutEffect } from 'react'

const useScript = (url: string) => {
  const [loaded, setLoaded] = useState(false)

  useLayoutEffect(() => {
    const script = document.createElement('script')
    script.src = url
    script.addEventListener('load', () => setLoaded(true))
    script.defer = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      setLoaded(false)
    }
  }, [url])

  return loaded
}

export default useScript
