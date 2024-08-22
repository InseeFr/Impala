import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
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
        port: 3000
    }
});
