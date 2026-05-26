#!/usr/bin/env node
// 用 Playwright + 系统 Chrome 从 Bulbapedia 抓 JP set 的卡片图.
// 一定要在没有 MDM/防火墙 拦截 bulbapedia.bulbagarden.net 的机器上跑.
//
// 用法:
//   node scripts/fetch-jp-card-images.js m1l
//   node scripts/fetch-jp-card-images.js m1l "Mega_Brave_(TCG)"   # 自定义 Bulbapedia 页面名
//
// 输出:
//   public/cards/jp/<setId>/<number>.jpg
//   public/cards/jp/manifest.json  ({setId: true})
//
// 前置:
//   pnpm i (会装 playwright)
//   pnpm exec playwright install chromium
//
// 如果 Bulbapedia 弹 Cloudflare challenge, 脚本会等 60 秒让它自动过. 真过不去
// 浏览器是显示的 (headless=false), 你可以手动点过去, 脚本会继续.
import { chromium } from 'playwright'
import { writeFile, mkdir, access, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// setId → Bulbapedia 页面 slug 默认映射
const BULBA_PAGE = {
  m1l: 'Mega_Brave_(TCG)',
  m1s: 'Mega_Symphonia_(TCG)',
  m2: 'Inferno_X_(TCG)',
  m2a: 'Mega_Dream_(TCG)',
  m3: 'Munikis_Zero_(TCG)',
  m4: 'Ninja_Spinner_(TCG)',
  m5: 'Abyss_Eye_(TCG)',
  m6: 'Storm_Emeralda_(TCG)',
  sv8a: 'Terastal_Festival_ex_(TCG)',
  sv9: 'Battle_Partners_(TCG)',
  sv9a: 'Heat_Wave_Arena_(TCG)',
  sv10: 'The_Glory_of_Team_Rocket_(TCG)',
  sv11b: 'Black_Bolt_(TCG)',
  sv11w: 'White_Flare_(TCG)',
}

const setId = process.argv[2]
const customPage = process.argv[3]
if (!setId) {
  console.error('用法: node scripts/fetch-jp-card-images.js <setId> [bulbapediaPageSlug]')
  console.error('例: node scripts/fetch-jp-card-images.js m1l')
  process.exit(1)
}

const pageSlug = customPage || BULBA_PAGE[setId]
if (!pageSlug) {
  console.error(`未知 setId: ${setId} — 传第二个参数指定 Bulbapedia 页面名`)
  process.exit(1)
}

const OUT_DIR = resolve(ROOT, 'public', 'cards', 'jp', setId)
const MANIFEST = resolve(ROOT, 'public', 'cards', 'jp', 'manifest.json')

await mkdir(OUT_DIR, { recursive: true })

console.log(`Fetching ${setId} from Bulbapedia: ${pageSlug}`)

const browser = await chromium.launch({
  channel: 'chrome', // 用系统 Chrome (绕过 headless 检测)
  headless: false,
})
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'en-US',
})
// 抹掉自动化痕迹
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
})

const page = await ctx.newPage()

const url = `https://bulbapedia.bulbagarden.net/wiki/${pageSlug}`
console.log('  ', url)
await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' })

// 等 Cloudflare challenge 过 (最多 60s, 也可手动操作)
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(1000)
  const title = await page.title()
  if (!/just a moment|お待ちください|attention required|cloudflare/i.test(title)) break
  if (i === 10) console.log('  Cloudflare challenge, waiting... (你可以手动点 checkbox)')
}

const title = await page.title()
console.log('  page title:', title)

// 提取卡片表里的链接和缩略图
// Bulbapedia 卡列表通常是 <table class="expansion"> 包含 <tr>, 每行有编号+卡名+链接+缩略图
const cards = await page.$$eval('table tr', (rows) => {
  const out = []
  for (const row of rows) {
    const tds = row.querySelectorAll('td')
    if (tds.length < 2) continue
    const numText = tds[0]?.textContent?.trim() || ''
    if (!/^\d+/.test(numText)) continue // 第一格不是数字就跳过
    const num = numText.match(/^\d+/)[0]
    const linkA = row.querySelector('a[href*="/wiki/"]:not(.image)')
    const link = linkA?.href
    const thumb = row.querySelector('img')?.src
    const name = linkA?.textContent?.trim()
    if (link && !out.find((x) => x.num === num)) out.push({ num, name, link, thumb })
  }
  return out
})
console.log(`  Found ${cards.length} cards in table`)

if (cards.length === 0) {
  console.log('  没找到卡片表. 看 page title 是不是 Cloudflare 还在挡')
  await browser.close()
  process.exit(1)
}

let ok = 0,
  fail = 0
for (let i = 0; i < cards.length; i++) {
  const c = cards[i]
  const outFile = resolve(OUT_DIR, `${c.num}.jpg`)
  try {
    await access(outFile)
    process.stdout.write(`  [${i + 1}/${cards.length}] ${c.num} ${c.name} (skip)\n`)
    ok++
    continue
  } catch {}

  // 进卡详情页拿大图
  try {
    await page.goto(c.link, { timeout: 20000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    // 找页面里最大的卡片图 (通常是 infobox 内的)
    const imgUrl = await page.$$eval('img', (imgs) => {
      // 找最大的 .jpg/.png
      const candidates = imgs
        .filter((i) => /\.(jpg|jpeg|png)/i.test(i.src))
        .map((i) => ({ src: i.src, area: (i.naturalWidth || i.width || 0) * (i.naturalHeight || i.height || 0) }))
        .sort((a, b) => b.area - a.area)
      return candidates[0]?.src
    })
    if (!imgUrl) throw new Error('no image')

    // 升级到原图: Bulbapedia thumb url 是 /thumb/.../<size>px-name.jpg, 去掉 /thumb/ 和 /<size>px-...
    const fullUrl = imgUrl
      .replace('/thumb/', '/')
      .replace(/\/\d+px-[^/]+$/, '')

    const resp = await page.context().request.get(fullUrl)
    if (!resp.ok()) throw new Error(`download ${resp.status()}`)
    const buf = await resp.body()
    await writeFile(outFile, buf)
    ok++
    process.stdout.write(`  [${i + 1}/${cards.length}] ${c.num} ${c.name} ✓ (${(buf.length / 1024).toFixed(0)}KB)\n`)
  } catch (e) {
    fail++
    process.stdout.write(`  [${i + 1}/${cards.length}] ${c.num} ${c.name} ✗ ${e.message}\n`)
  }
  await page.waitForTimeout(300) // 别打挂 Bulbapedia
}

console.log(`\n${ok}/${cards.length} cards downloaded, ${fail} failed`)

// 更新 manifest
let manifest = {}
try {
  manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
} catch {}
manifest[setId] = true
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log(`Updated ${MANIFEST}`)

await browser.close()
