#!/usr/bin/env node
// 下载某 set 的所有卡片图到 public/cards/<setId>/, 写 manifest.
// 用法:
//   node scripts/download-images.js sv8         # 单个 set
//   node scripts/download-images.js sv8 sv7     # 多个 set
//   node scripts/download-images.js --all       # 全部 173 个 set (很大, 慢)
//
// 文件命名: public/cards/<setId>/<number>.png 和 <number>_hires.png
// 已存在的文件会跳过, 可以反复运行。
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CARDS_DIR = resolve(ROOT, 'public', 'cards')
const MANIFEST = resolve(CARDS_DIR, 'manifest.json')

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('用法: node scripts/download-images.js <setId> [...]')
  console.error('     node scripts/download-images.js --all')
  process.exit(1)
}

let setIds = args
if (args[0] === '--all') {
  const sets = JSON.parse(await readFile(resolve(ROOT, 'public', 'sets.json'), 'utf8'))
  setIds = sets.map((s) => s.id)
  console.log(`将下载全部 ${setIds.length} 个 set 的图`)
}

// 读取/初始化 manifest
await mkdir(CARDS_DIR, { recursive: true })
let manifest = {}
try {
  manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
} catch {
  manifest = {}
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function fetchCardsForSet(setId) {
  const all = []
  let page = 1
  while (true) {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&select=id,number,images`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API ${res.status} for ${url}`)
    const json = await res.json()
    all.push(...json.data)
    if (json.data.length < 250) break
    page++
    if (page > 20) break
  }
  return all
}

async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(file, buf)
}

async function processSet(setId) {
  const dir = resolve(CARDS_DIR, setId)
  await mkdir(dir, { recursive: true })
  const cards = await fetchCardsForSet(setId)
  console.log(`[${setId}] ${cards.length} 张`)
  let dl = 0
  let skip = 0
  let fail = 0
  for (const c of cards) {
    const small = c.images?.small
    const large = c.images?.large
    const smallFile = resolve(dir, `${c.number}.png`)
    const largeFile = resolve(dir, `${c.number}_hires.png`)
    if (small && !(await exists(smallFile))) {
      try {
        await download(small, smallFile)
        dl++
      } catch (e) {
        fail++
        console.warn(`  fail small ${c.number}: ${e.message}`)
      }
    } else if (small) skip++
    if (large && !(await exists(largeFile))) {
      try {
        await download(large, largeFile)
        dl++
      } catch (e) {
        fail++
        console.warn(`  fail large ${c.number}: ${e.message}`)
      }
    } else if (large) skip++
    // 礼貌的 rate limit
    await new Promise((r) => setTimeout(r, 30))
  }
  console.log(`[${setId}] 下载 ${dl}, 跳过(已存在) ${skip}, 失败 ${fail}`)
  manifest[setId] = true
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
}

for (const id of setIds) {
  try {
    await processSet(id)
  } catch (e) {
    console.error(`[${id}] 整体失败: ${e.message}`)
  }
}

console.log('\n完成。manifest 写入', MANIFEST)
