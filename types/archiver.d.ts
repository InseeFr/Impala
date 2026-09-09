// archiver 8 ne publie pas de types et @types/archiver ne decrit que l'API v6
// (fonction `archiver()`), pas les classes exportees depuis la v8. On declare
// donc ici la seule surface utilisee par create-zip.ts.
declare module "archiver" {
    import { Transform } from "node:stream";

    export interface ArchiveOptions {
        zlib?: { level?: number };
    }

    export interface GlobOptions {
        cwd?: string;
        ignore?: string[];
    }

    export class ZipArchive extends Transform {
        constructor(options?: ArchiveOptions);
        /** Nombre d'octets ecrits dans l'archive. */
        pointer(): number;
        glob(pattern: string, options?: GlobOptions): this;
        finalize(): Promise<void>;
    }
}
