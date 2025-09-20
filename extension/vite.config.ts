import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        newtab: 'public/newtab.html',
        background: 'src/background/index.ts'
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/index.js'
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})

