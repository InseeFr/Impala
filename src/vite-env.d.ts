/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Injectées depuis package.json par le script `pre-script` (cross-env).
    readonly VITE_NAME?: string;
    readonly VITE_VERSION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
