import { defineConfig } from 'vite'

export default defineConfig({
    base: '/seiyuu/',
    server: {
        proxy: {
            '/seiyuu/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: '../backend/src/main/resources/static',
        emptyOutDir: true
    }
})
