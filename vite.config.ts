import react from "@vitejs/plugin-react-swc";
import { configDefaults } from "vitest/config";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const baseDir = resolve(import.meta.dirname, "pages/");

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
                    const safeName = basename(req.url?.split("?")[0] || "");

                    const filePath = resolve(baseDir, safeName);

                    if (!filePath.startsWith(baseDir)) {
                        throw new Error("Access denied: Attempted path traversal.");
                    }

                    res.setHeader("Content-Type", "application/json");
                    res.end(readFileSync(filePath).toString());
                    return false;
                }
            }
        }
    }
};
