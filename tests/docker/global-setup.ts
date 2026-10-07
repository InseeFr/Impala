import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const COMPOSE_FILE = new URL("compose.yaml", import.meta.url).pathname;
const READY_URL = "http://localhost:8080/index.html";
// nginx sert les fichiers statiques des son demarrage, bien avant que le process
// node du mock n'ecoute : le proxy repond alors 502. On sonde donc aussi la chaine
// complete, sinon les regles 5 et 7 echouent sur une course au demarrage.
const PROXY_READY_URL = "http://localhost:8080/sparql?query=ASK%7B%7D";

export function compose(...args: string[]) {
    execFileSync("docker", ["compose", "-f", COMPOSE_FILE, ...args], { stdio: "inherit" });
}

async function waitFor(label: string, url: string, init?: RequestInit, timeoutMs = 120_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(url, init)).ok) return;
        } catch {
            // le conteneur n'ecoute pas encore
        }
        await sleep(500);
    }
    throw new Error(`${label} n'a pas repondu sur ${url} en ${timeoutMs} ms`);
}

export default async function globalSetup() {
    compose("up", "-d", "--build");
    await waitFor("Impala", READY_URL);
    // En-tete non-HTML : sans elle, la regle 6 sert le formulaire au lieu de proxifier,
    // et la sonde validerait nginx seul.
    await waitFor("Le mock SPARQL", PROXY_READY_URL, {
        headers: { accept: "application/sparql-results+json" }
    });
}
