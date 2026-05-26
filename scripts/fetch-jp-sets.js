#!/usr/bin/env node
// 从 card-binder.com 抓 2025-2026 日版 Pokemon TCG sets 的元数据 + pack art.
// 输出: public/jp/sets.json
// 用法: node scripts/fetch-jp-sets.js [--all]
//   默认只抓 2025-2026, --all 抓全部 JP sets
import { writeFile, mkdir, access, readFile } from 'node:fs/promises'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(ROOT, 'src', 'data')
const PACKS_DIR = resolve(ROOT, 'public', 'packs')
const SHOP = 'https://card-binder.com'

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
}

const allMode = process.argv.includes('--all')

async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`${res.status}`)
      const text = await res.text()
      if (!text) throw new Error('empty body')
      return JSON.parse(text)
    } catch (e) {
      if (i === retries) throw e
      await new Promise((r) => setTimeout(r, 500 + i * 500))
    }
  }
}

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function downloadImg(url, file) {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(file, buf)
}

// === Step 1: 拿所有 JP-coded collections ===
console.log('Fetching card-binder collections...')
const cdata = await fetchJson(`${SHOP}/collections.json?limit=250`)
// JP collection: title 有 [code] 或 handle 后缀像 -sv8a / -m1l
const codeRe = /(m\d+\w*|sv\d+\w*|s\d+\w*)/i
function extractCode(col) {
  const t = col.title.match(/\[([^\]]+)\]/)
  if (t && codeRe.test(t[1])) return t[1].toLowerCase()
  const h = col.handle.match(/-(m\d+\w*|sv\d+\w*|s\d+\w*)$/i)
  if (h) return h[1].toLowerCase()
  return null
}
const jpCols = cdata.collections.filter((c) => extractCode(c))
console.log(`Found ${jpCols.length} JP-coded collections`)

// === Step 2: 对每个 collection 拉产品, 找 Japanese Booster Pack, 提取数据 ===
function parseReleaseDate(body) {
  if (!body) return null
  // 清 HTML
  const text = body.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  const months = '(January|February|March|April|May|June|July|August|September|October|November|December)'
  // "August 1, 2025" / "january 24, 2025"
  let m = text.match(new RegExp(months + '\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})', 'i'))
  if (m) {
    const monthNum = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(m[1].toLowerCase()) + 1
    return `${m[3]}/${String(monthNum).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}`
  }
  // "22-05-2026" (DD-MM-YYYY)
  m = text.match(/\b(\d{1,2})-(\d{1,2})-(20\d{2})\b/)
  if (m) return `${m[3]}/${String(m[2]).padStart(2,'0')}/${String(m[1]).padStart(2,'0')}`
  return null
}

function deriveSeries(tags) {
  if (tags.some(t => t === 'Mega Evolution' || /^ME\d+/i.test(t))) return 'Mega Evolution'
  if (tags.some(t => t === 'Scarlet & Violet' || /^SV\d+/i.test(t))) return 'Scarlet & Violet'
  if (tags.some(t => t === 'Sword & Shield' || /^SWSH/i.test(t))) return 'Sword & Shield'
  if (tags.some(t => t === 'Sun & Moon' || /^SM\d+/i.test(t))) return 'Sun & Moon'
  return 'Other'
}

// card-binder 描述里没写发售日的 set, 这里手工补
const MANUAL_DATES = {
  sv11b: '2025/07/18', // Black Bolt
}

await mkdir(DATA_DIR, { recursive: true })
await mkdir(PACKS_DIR, { recursive: true })

const sets = []
const missImg = []

for (const col of jpCols) {
  const setId = extractCode(col)
  if (!setId) continue

  let products
  try {
    const data = await fetchJson(`${SHOP}/collections/${col.handle}/products.json?limit=20`)
    products = data.products || []
  } catch (e) {
    console.log(`  [${setId}] collection fetch failed: ${e.message}`)
    continue
  }

  // 找 Japanese Booster Pack (排除 Korean / Box / Bundle / ETB)
  const pack = products.find(p =>
    /booster pack/i.test(p.title) &&
    !/korean|\bkr\b|english/i.test(p.title) &&
    !/box|bundle|trainer|collection|tin|sleeved/i.test(p.title) &&
    (p.tags || []).some(t => t === 'Japanese' || t === 'JP' || t === 'jp')
  )

  if (!pack) {
    console.log(`  [${setId}] no Japanese Booster Pack product`)
    continue
  }

  // 只接受 body 里明确写的发售日; 已知 body 没写但应该有的 set 在 MANUAL_DATES 补
  let releaseDate = parseReleaseDate(pack.body_html) || MANUAL_DATES[setId]
  if (!releaseDate) {
    console.log(`  [${setId}] couldn't parse release date — skip`)
    continue
  }

  if (!allMode) {
    const year = parseInt(releaseDate.slice(0, 4))
    if (year < 2025 || year > 2026) continue
  }

  // set name: 从 collection title 去掉 bracket (没 bracket 直接用 title)
  const setName = col.title.replace(/\s*\[[^\]]+\]\s*/, '').trim()
  const series = deriveSeries(pack.tags || [])
  const imgUrl = pack.images?.[0]?.src

  const entry = {
    id: setId,
    name: setName,
    series,
    printedTotal: 100, // 占位, 真实卡数需另外补
    total: 100,
    ptcgoCode: setId.toUpperCase(),
    releaseDate,
    symbol: '',
    logo: '',
    custom: true,
    cardBinderHandle: col.handle,
  }
  sets.push(entry)
  console.log(`  ✓ ${setId.padEnd(8)} ${releaseDate} ${setName}`)

  // 下载 pack 图 (如果还没有)
  if (imgUrl) {
    const ext = (extname(imgUrl.split('?')[0]).slice(1) || 'webp').toLowerCase()
    const file = resolve(PACKS_DIR, `${setId}.${ext}`)
    const hasAny = await Promise.all(['webp','jpg','jpeg','png'].map(e => exists(resolve(PACKS_DIR, `${setId}.${e}`)))).then(arr => arr.some(Boolean))
    if (!hasAny) {
      try {
        const u = new URL(imgUrl)
        u.searchParams.set('width', '800')
        await downloadImg(u.toString(), file)
        console.log(`     ↓ pack art saved: ${setId}.${ext}`)
      } catch (e) {
        missImg.push(setId)
        console.log(`     ✗ pack art fail: ${e.message}`)
      }
    }
  }

  await new Promise((r) => setTimeout(r, 200))
}

// 按 releaseDate 倒序排
sets.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))

const out = resolve(DATA_DIR, 'jp-sets.json')
await writeFile(out, JSON.stringify(sets, null, 2))

console.log(`\n${sets.length} sets → ${out}`)
if (missImg.length) console.log(`Missing pack imgs: ${missImg.join(', ')}`)
console.log('\n下次刷新: node scripts/fetch-jp-sets.js (跳过已下载的 pack 图)')
