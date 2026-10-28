import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync } from 'node:fs'

/** Ships the framework-neutral HTML examples and CSS next to the gallery so the links work after a build. */
const copyGuidance = () => ({
  name: 'copy-guidance',
  closeBundle() {
    for (const d of ['examples', 'css']) cpSync(`guidance/${d}`, `dist/guidance/${d}`, { recursive: true })
  },
})

export default defineConfig({ base: './', plugins: [react(), copyGuidance()], server: { host: true, port: 5173 } })
