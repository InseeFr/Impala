// Couche d'accès aux données : centralise les appels réseau de l'application.
// `fetch` ne rejette pas sur un statut 4xx/5xx, chaque réponse est donc
// validée ici avant d'être consommée, pour ne jamais interpréter un corps
// d'erreur comme une réponse valide.

/** Une requête SPARQL d'exemple, telle que décrite dans queries.json. */
export interface Query {
    label: string;
    path: string;
}

/** Le manifeste des requêtes d'exemple, servi par l'application elle-même. */
const QUERIES_MANIFEST = "/queries/queries.json";

// queries.json est une donnée distante : ses `path` ne sont pas dignes de
// confiance tant qu'ils n'ont pas été confrontés à ce motif. Seul un fichier
// .txt posé à plat dans /queries/ est accepté — ni URL absolue, ni autre
// protocole, ni remontée d'arborescence — et c'est le texte reconnu par le
// motif, non la valeur d'origine, qui circule ensuite dans l'application.
const QUERY_PATH = /^\/queries\/[a-zA-Z0-9_-]+\.txt$/;

async function fetchOk(path: string): Promise<Response> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`${path}: HTTP ${response.status} ${response.statusText}`);
    }
    return response;
}

export async function loadQueries(): Promise<Query[]> {
    const response = await fetchOk(QUERIES_MANIFEST);
    const entries = (await response.json()) as Query[];
    return entries.flatMap(entry => {
        const path = QUERY_PATH.exec(entry.path)?.[0];
        return path ? [{ label: entry.label, path }] : [];
    });
}

export async function loadQueryBody(path: string): Promise<string> {
    const response = await fetchOk(path);
    return response.text();
}
