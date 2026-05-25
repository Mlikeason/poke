#!/usr/bin/env node
// 从 card-binder.com 抓 Pokemon TCG 卡包包装图.
// 策略: 列出所有 collection (236 个), title 匹配我们 sets.json 的 set name, 然后从
// 那个 set 自己的 collection 里找 "X Booster Pack" 产品, 下载第一张图.
//
// 用法: node scripts/fetch-pack-images.js [--force]
//   --force  覆盖已存在的图 (默认跳过)
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PACKS_DIR = resolve(ROOT, 'public', 'packs')
const SHOP = 'https://card-binder.com'
const force = process.argv.includes('--force')

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function downloadImg(url, file) {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(file, buf)
}

const sets = JSON.parse(await readFile(resolve(ROOT, 'public', 'sets.json'), 'utf8'))
await mkdir(PACKS_DIR, { recursive: true })

// 1. 列出所有 card-binder collection, 建 title→handle 表 (lowercase)
console.log('Fetching all collections...')
const allCollections = []
for (let page = 1; page <= 5; page++) {
  const data = await fetchJson(`${SHOP}/collections.json?limit=250&page=${page}`)
  if (!data.collections?.length) break
  allCollections.push(...data.collections)
  if (data.collections.length < 250) break
}
console.log(`  ${allCollections.length} collections`)

const titleToHandle = new Map()
for (const c of allCollections) {
  const key = c.title.toLowerCase().trim()
  if (!titleToHandle.has(key)) titleToHandle.set(key, c.handle)
}

// 多个 set 共享 collection 的特殊映射
const MANUAL_COLLECTION = {
  zsv10pt5: 'pokemon-tcg-black-bolt-white-flare-sv10-5',
  rsv10pt5: 'pokemon-tcg-black-bolt-white-flare-sv10-5',
}

// 2. 对每个 set, 在 collection 表里找匹配的 handle
function findCollectionForSet(set) {
  if (MANUAL_COLLECTION[set.id]) return MANUAL_COLLECTION[set.id]
  const candidates = [
    set.name, // "Surging Sparks"
    set.name.replace(/&/g, 'and'), // "Sword and Shield" → some collections might use this
  ]
  for (const c of candidates) {
    const handle = titleToHandle.get(c.toLowerCase())
    if (handle) return handle
  }
  return null
}

// 3. 在 collection 里找 "X Booster Pack" 产品, 下载第一张图
async function processSet(set) {
  if (!force) {
    // 已存在任一扩展名就跳过
    for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
      if (await exists(resolve(PACKS_DIR, `${set.id}.${ext}`))) return 'skip'
    }
  }

  const handle = findCollectionForSet(set)
  if (!handle) return 'no-collection'

  let products
  try {
    const data = await fetchJson(`${SHOP}/collections/${handle}/products.json?limit=50`)
    products = data.products || []
  } catch (e) {
    return `err: ${e.message}`
  }

  // 优先 "X Booster Pack" (英文版, 不带 Japanese/Korean/KR/JP)
  const isExclude = (t) => /japanese|korean|\bkr\b|\bjp\b|live-stream|sleeved/i.test(t)
  const cleanName = set.name.toLowerCase()

  const exactMatch = products.find(
    (p) =>
      !isExclude(p.title) &&
      p.title.toLowerCase() === `${cleanName} booster pack`,
  )
  // 退而求其次: 包含 set name 且是 "Booster Pack", 排除 box/bundle/ETB
  // (避免: 某 collection 含日文 set 时把日文 pack 错配给英文 set)
  const looseMatch =
    exactMatch ||
    products.find(
      (p) =>
        !isExclude(p.title) &&
        /booster pack/i.test(p.title) &&
        !/box|bundle|trainer|collection|tin/i.test(p.title) &&
        p.title.toLowerCase().includes(cleanName),
    )

  if (!looseMatch) return 'no-pack-product'

  const rawUrl = looseMatch.images?.[0]?.src
  if (!rawUrl) return 'no-image'

  // 通过 Shopify CDN 缩到合理宽度, 节省带宽
  const u = new URL(rawUrl)
  u.searchParams.set('width', '800')
  const imgUrl = u.toString()

  const ext = (extname(rawUrl.split('?')[0]).slice(1) || 'webp').toLowerCase()
  const file = resolve(PACKS_DIR, `${set.id}.${ext}`)

  try {
    await downloadImg(imgUrl, file)
    return `ok: ${looseMatch.title}`
  } catch (e) {
    return `dl-err: ${e.message}`
  }
}

const results = { ok: 0, skip: 0, miss: 0 }
const missList = []

for (let i = 0; i < sets.length; i++) {
  const s = sets[i]
  const r = await processSet(s)
  const tag = r.startsWith('ok:') ? '✓' : r === 'skip' ? '·' : '✗'
  if (r.startsWith('ok:')) results.ok++
  else if (r === 'skip') results.skip++
  else {
    results.miss++
    missList.push({ id: s.id, name: s.name, reason: r })
  }
  if (r.startsWith('ok:') || r === 'skip') {
    process.stdout.write(`  ${tag} ${s.id.padEnd(12)} ${s.name}${r.startsWith('ok:') ? ' ← ' + r.slice(4) : ''}\n`)
  }
  await new Promise((r) => setTimeout(r, 80))
}

console.log(`\n下载 ${results.ok}, 跳过(已存在) ${results.skip}, 没找到 ${results.miss}`)
if (missList.length) {
  console.log('\n没找到 pack 图的 set:')
  for (const m of missList) console.log(`  ${m.id.padEnd(12)} ${m.name.padEnd(28)} ${m.reason}`)
}
