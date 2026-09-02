/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKILLPILL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
