// Couche d'accès aux données : centralise les appels réseau de l'application.
// `fetch` ne rejette pas sur un statut 4xx/5xx, chaque réponse est donc
// validée ici avant d'être consommée, pour ne jamais interpréter un corps
// d'erreur comme une réponse valide.

/** Une requête SPARQL d'exemple, telle que décrite dans queries.json. */
export interface Query {
    label: string;
    path: string;
}

async function fetchOk(path: string): Promise<Response> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`${path}: HTTP ${response.status} ${response.statusText}`);
    }
    return response;
}

export async function loadQueries(): Promise<Query[]> {
    const response = await fetchOk("/queries/queries.json");
    return (await response.json()) as Query[];
}

export async function loadQueryBody(path: string): Promise<string> {
    const response = await fetchOk(path);
    return response.text();
}
