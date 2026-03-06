import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 950,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-three/fiber')) {
            return 'r3f-runtime'
          }

          if (id.includes('three')) {
            return 'three-core'
          }

          return undefined
        },
      },
    },
  },
})
