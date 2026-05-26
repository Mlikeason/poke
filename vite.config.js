import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// build 时清掉 dist/cards/ 下的 EN 缓存图 (本地 dev 才需要, 部署回退到 pokemontcg.io).
// 保留 dist/cards/jp/ (JP 图源不稳, 必须随部署上)
const stripEnCardCache = {
  name: 'strip-en-card-cache',
  apply: 'build',
  closeBundle() {
    const dir = resolve('dist/cards')
    if (!existsSync(dir)) return
    let removed = 0
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'jp' || entry.name === 'manifest.json') continue
      rmSync(resolve(dir, entry.name), { recursive: true, force: true })
      removed++
    }
    if (removed) console.log(`[strip-en-card-cache] removed ${removed} EN entries from dist/cards/`)
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripEnCardCache],
})
