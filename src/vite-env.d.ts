/// <reference types="vite/client" />

// Configuration injectee dans le bundle par Vite au build (cf. .env).
interface ImportMetaEnv {
    /** Instance SPARQL interrogee par l'editeur. */
    readonly VITE_SPARQL_ENDPOINT: string;
    /** Prefixe applique aux liens id.insee.fr reecrits en requete DESCRIBE. */
    readonly VITE_SPARQL_PREFIX: string;
    /** Instance Insee de reference, valeur de comparaison et non cible. */
    readonly VITE_INSEE_SPARQL_ENDPOINT: string;
    /** Nom du paquet, injecte par le script `pre-script`. */
    readonly VITE_NAME?: string;
    /** Version du paquet, injectee par le script `pre-script`. */
    readonly VITE_VERSION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
