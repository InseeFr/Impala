import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    plugins: [react()],
    test: {
        environment: "jsdom",
        dangerouslyIgnoreUnhandledErrors: true
    },
    build: {
        outDir: "temp_dist"
    }
});
