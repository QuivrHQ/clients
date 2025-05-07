export const normalizeNewlinesToHtml = (text: string) => {
  return text.replace(/\\n/g, '\n').replace(/\n/g, '<br>')
}
