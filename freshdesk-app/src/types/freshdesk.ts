type FreshdeskClient = {
  request: {
    invokeTemplate: (templateName: string, options?: any) => Promise<any>
  }
}

export type { FreshdeskClient }
