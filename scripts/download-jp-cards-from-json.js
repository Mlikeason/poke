#!/usr/bin/env node
// 读 bookmarklet 导出的 JSON, 下载每张卡的图到 public/cards/jp/<setId>/<num>.<ext>
//
// 用法:
//   node scripts/download-jp-cards-from-json.js m1l ./jp-cards-megabrave.json
//
// JSON 格式 (bookmarklet 生成):
//   [{"num":"001","name":"...","link":"...","imgUrl":"https://..."}]
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const setId = process.argv[2]
const jsonPath = process.argv[3]
if (!setId || !jsonPath) {
  console.error('用法: node scripts/download-jp-cards-from-json.js <setId> <jsonPath>')
  console.error('例: node scripts/download-jp-cards-from-json.js m1l ./jp-cards-megabrave.json')
  process.exit(1)
}

const data = JSON.parse(await readFile(jsonPath, 'utf8'))
const outDir = resolve(ROOT, 'public', 'cards', 'jp', setId)
const manifestPath = resolve(ROOT, 'public', 'cards', 'jp', 'manifest.json')

await mkdir(outDir, { recursive: true })

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://bulbapedia.bulbagarden.net/',
}

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

let ok = 0, fail = 0, skip = 0
for (let i = 0; i < data.length; i++) {
  const c = data[i]
  if (!c.imgUrl) {
    fail++
    continue
  }
  const ext = (extname(c.imgUrl.split('?')[0]).slice(1) || 'jpg').toLowerCase()
  const out = resolve(outDir, `${c.num}.${ext}`)
  if (await exists(out)) {
    skip++
    continue
  }
  try {
    const res = await fetch(c.imgUrl, { headers: UA })
    if (!res.ok) throw new Error(`${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(out, buf)
    ok++
    process.stdout.write(`  [${i + 1}/${data.length}] ${c.num} ${c.name} ✓ (${(buf.length/1024).toFixed(0)}KB)\n`)
  } catch (e) {
    fail++
    process.stdout.write(`  [${i + 1}/${data.length}] ${c.num} ✗ ${e.message}\n`)
  }
  await new Promise((r) => setTimeout(r, 250))
}

console.log(`\n${ok} downloaded, ${skip} skipped (already on disk), ${fail} failed`)

// Update manifest
let manifest = {}
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')) } catch {}
manifest[setId] = true
await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`Manifest updated: ${manifestPath}`)
