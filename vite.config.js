import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// build 时把 dist/cards/ 剥掉, 因为本地缓存图不该进部署 (1.8GB) - 部署后 App 自动 fallback 到 pokemontcg.io
const stripLocalCardCache = {
  name: 'strip-local-card-cache',
  apply: 'build',
  closeBundle() {
    const dir = resolve('dist/cards')
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
      console.log('[strip-local-card-cache] removed dist/cards/')
    }
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripLocalCardCache],
})
