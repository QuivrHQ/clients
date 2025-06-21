interface ImportMetaEnv {
  readonly VITE_ZENDESK_LOCATION: string
  readonly VITE_ZENDESK_MODAL_LOCATION: string
  readonly VITE_QUIVR_API_URL: string
  readonly VITE_QUIVR_GOBOCOM_API_URL: string
  readonly VITE_ZENDESK_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
