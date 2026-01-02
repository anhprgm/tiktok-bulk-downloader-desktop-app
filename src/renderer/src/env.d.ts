/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly MAIN_VITE_GIST_SECRET_KEY: string
  readonly MAIN_VITE_GIST_ID: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
