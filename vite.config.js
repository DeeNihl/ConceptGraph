import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 5174,
        strictPort: false,
        open: true
    },
    // Serve files from the public directory
    publicDir: 'public',
    // check in
    // Configure module resolution
    resolve: {
      alias: {}
    },
    optimizeDeps: {
        exclude: ['@neo4j-nvl/layout-workers'],
        include: [
            '@neo4j-nvl/layout-workers > cytoscape',
            '@neo4j-nvl/layout-workers > cytoscape-cose-bilkent',
            '@neo4j-nvl/layout-workers > @neo4j-bloom/dagre',
            '@neo4j-nvl/layout-workers > bin-pack',
            '@neo4j-nvl/layout-workers > graphlib'
        ],
        esbuildOptions: {
            target: 'es2020'
        }
    },
    build: {
        target: 'es2020'
    }
})