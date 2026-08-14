import react from "@vitejs/plugin-react-swc";
import { configDefaults } from "vitest/config";
import { readdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const baseDir = resolve(import.meta.dirname, "pages/");

// Allowlist statique des fichiers .txt servables, calculée au démarrage.
// On ne sert que des noms présents dans cet ensemble : la valeur utilisée pour
// construire le chemin provient de l'allowlist, jamais de l'entrée utilisateur.
const allowedTxtFiles = new Set(
    readdirSync(resolve(baseDir, "queries")).filter(name => name.endsWith(".txt"))
);

// https://vitejs.dev/config/
export default {
    base: "/",
    plugins: [react()],
    test: {
        environment: "jsdom",
        dangerouslyIgnoreUnhandledErrors: true,
        exclude: [...configDefaults.exclude, "tests/*"],
        coverage: {
            reporter: "lcov",
            include: ["src/**/*.jsx"]
        }
    },
    build: {
        outDir: "temp_dist"
    },
    server: {
        port: 3000,
        proxy: {
            "/queries/queries.json": {
                bypass: function (req, res) {
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                        readFileSync(
                            resolve(import.meta.dirname, "pages/queries/queries.json")
                        ).toString()
                    );
                    return false;
                }
            },
            "^/queries/.*.txt": {
                bypass: function (req, res) {
                    const requestedName = basename(req.url?.split("?")[0] || "");

                    // `safeName` provient de l'allowlist, pas de l'input utilisateur :
                    // le chemin servi est donc toujours une valeur d'origine connue.
                    const safeName = [...allowedTxtFiles].find(name => name === requestedName);
                    if (!safeName) {
                        throw new Error("Access denied: Attempted path traversal.");
                    }

                    const filePath = resolve(baseDir, "queries", safeName);

                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("X-Content-Type-Options", "nosniff");
                    res.end(readFileSync(filePath).toString());
                    return false;
                }
            }
        }
    }
};
