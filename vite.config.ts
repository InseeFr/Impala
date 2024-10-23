import react from "@vitejs/plugin-react-swc";
import { configDefaults } from "vitest/config";
import { readFileSync } from "fs";
import { resolve } from "path";

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
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                        readFileSync(
                            resolve(import.meta.dirname, "pages/", req.url!.replace("/", ""))
                        ).toString()
                    );
                    return false;
                }
            }
        }
    }
};
