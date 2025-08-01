import { renderHook } from '@testing-library/react-hooks' // or from '@testing-library/react' in newer setups
import { act } from 'react-dom/test-utils'
import useScript from './useScript'

describe('useScript', () => {
  it('creates the script with correct attributes and handles load/cleanup', () => {
    // Keep the real createElement for non-script tags
    const realCreateElement = document.createElement.bind(document)

    // Prepare a real <script> element so it behaves like a DOM node
    const scriptEl = realCreateElement('script') as HTMLScriptElement

    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: any, options?: any) => {
      if (tagName === 'script') return scriptEl as any
      return realCreateElement(tagName, options)
    })

    const appendSpy = jest.spyOn(document.head, 'appendChild')
    const removeSpy = jest.spyOn(document.head, 'removeChild')

    const { result, unmount } = renderHook(() => useScript('https://example.com/script.js'))

    expect(appendSpy).toHaveBeenCalledWith(scriptEl)
    // jsdom normalizes .src to an absolute URL; use toContain
    expect(scriptEl.src).toContain('https://example.com/script.js')
    expect(scriptEl.defer).toBe(true)

    // Simulate the script load
    act(() => {
      scriptEl.dispatchEvent(new Event('load'))
    })
    expect(result.current).toBe(true)

    // Unmount should remove the script and reset state
    unmount()
    expect(removeSpy).toHaveBeenCalledWith(scriptEl)

    createSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
