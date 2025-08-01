import { normalizeNewlinesToHtml } from './html'

describe('html utils', () => {
  describe('normalizeNewlinesToHtml', () => {
    it('should convert escaped newlines to HTML br tags', () => {
      const input = 'Hello\\nWorld\\nTest'
      const expected = 'Hello<br>World<br>Test'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should convert actual newlines to HTML br tags', () => {
      const input = 'Hello\nWorld\nTest'
      const expected = 'Hello<br>World<br>Test'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle mixed escaped and actual newlines', () => {
      const input = 'Hello\\nWorld\nTest\\nMixed'
      const expected = 'Hello<br>World<br>Test<br>Mixed'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle empty string', () => {
      const input = ''
      const expected = ''

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle string with no newlines', () => {
      const input = 'Hello World Test'
      const expected = 'Hello World Test'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle string with only escaped newlines', () => {
      const input = '\\n\\n\\n'
      const expected = '<br><br><br>'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle string with only actual newlines', () => {
      const input = '\n\n\n'
      const expected = '<br><br><br>'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle string with newlines at the beginning and end', () => {
      const input = '\nHello World\n'
      const expected = '<br>Hello World<br>'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle string with escaped newlines at the beginning and end', () => {
      const input = '\\nHello World\\n'
      const expected = '<br>Hello World<br>'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should handle complex multiline text', () => {
      const input = 'Line 1\\nLine 2\nLine 3\\nLine 4\nLine 5'
      const expected = 'Line 1<br>Line 2<br>Line 3<br>Line 4<br>Line 5'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })

    it('should preserve other special characters', () => {
      const input = 'Hello\\nWorld!@#$%^&*()\nTest'
      const expected = 'Hello<br>World!@#$%^&*()<br>Test'

      const result = normalizeNewlinesToHtml(input)

      expect(result).toBe(expected)
    })
  })
})
