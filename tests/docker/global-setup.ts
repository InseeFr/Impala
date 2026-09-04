import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const COMPOSE_FILE = new URL("compose.yaml", import.meta.url).pathname;
const READY_URL = "http://localhost:8080/index.html";

export function compose(...args: string[]) {
    execFileSync("docker", ["compose", "-f", COMPOSE_FILE, ...args], { stdio: "inherit" });
}

async function waitForImpala(timeoutMs = 120_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(READY_URL)).ok) return;
        } catch {
            // le conteneur n'ecoute pas encore
        }
        await sleep(500);
    }
    throw new Error(`Impala n'a pas repondu sur ${READY_URL} en ${timeoutMs} ms`);
}

export default async function globalSetup() {
    compose("up", "-d", "--build");
    await waitForImpala();
}
