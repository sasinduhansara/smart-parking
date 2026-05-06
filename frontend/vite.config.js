import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }),
  ],
})
