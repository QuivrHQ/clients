type FreshdeskClient = {
  data: {
    get: (key: string) => Promise<any>
  }
  interface: {
    trigger: (action: string, options?: any) => Promise<any>
  }
  request: {
    invokeTemplate: (templateName: string, options?: any) => Promise<any>
  }
}

export type { FreshdeskClient }
