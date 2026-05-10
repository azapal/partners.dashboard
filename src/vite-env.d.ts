/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_STAGE?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_ACCOUNT_BASE_URL_LOCAL?: string;
  readonly VITE_ACCOUNT_BASE_URL_DEV?: string;
  readonly VITE_ACCOUNT_BASE_URL_STAGING?: string;
  readonly VITE_ACCOUNT_BASE_URL_PROD?: string;
  readonly VITE_AZAPAL_BASE_URL_LOCAL?: string;
  readonly VITE_AZAPAL_BASE_URL_DEV?: string;
  readonly VITE_AZAPAL_BASE_URL_STAGING?: string;
  readonly VITE_AZAPAL_BASE_URL_PROD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
