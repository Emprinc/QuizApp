import { useEffect, useRef } from 'react'
import katex from 'katex'

export function MathText({ text, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !text) return

    const render = (str) => {
      return str.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { throwOnError: false, displayMode: true })
        } catch {
          return math
        }
      }).replace(/\$([^$]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { throwOnError: false, displayMode: false })
        } catch {
          return math
        }
      })
    }

    ref.current.innerHTML = render(text)
  }, [text])

  return <div ref={ref} className={className} />
}
