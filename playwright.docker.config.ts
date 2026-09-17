import { defineConfig } from "@playwright/test";

/**
 * Tests des regles de reecriture nginx, joues contre l'image Docker.
 * Configuration distincte de playwright.config.ts, qui vise le serveur de
 * developpement Vite : ici on ne teste pas l'interface mais le routage HTTP.
 */
export default defineConfig({
    testDir: "./tests/docker",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: [["list"]],
    timeout: 30_000,
    globalSetup: "./tests/docker/global-setup.ts",
    globalTeardown: "./tests/docker/global-teardown.ts",
    use: {
        baseURL: "http://localhost:8080"
    }
});
