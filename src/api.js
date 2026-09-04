// Couche d'accès aux données : centralise les appels réseau de l'application.
// `fetch` ne rejette pas sur un statut 4xx/5xx, chaque réponse est donc
// validée ici avant d'être consommée, pour ne jamais interpréter un corps
// d'erreur comme une réponse valide.
async function fetchOk(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`${path}: HTTP ${response.status} ${response.statusText}`);
    }
    return response;
}

export async function loadQueries() {
    const response = await fetchOk("/queries/queries.json");
    return response.json();
}

export async function loadConfiguration() {
    const response = await fetchOk("/configuration.json");
    return response.json();
}

export async function loadQueryBody(path) {
    const response = await fetchOk(path);
    return response.text();
}
