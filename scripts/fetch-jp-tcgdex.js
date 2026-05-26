#!/usr/bin/env node
// 从 TCGdex (api.tcgdex.net) 抓 JP set + 卡片元数据.
// 输出:
//   src/data/jp-sets.json   — set 列表 (替代旧的 card-binder scrape)
//   src/data/jp-cards.json  — { setId: [{id,name,number,img,imgLarge}, ...] }
// 用法: node scripts/fetch-jp-tcgdex.js [--all]
//   默认: 2025-2026 释出的 JP sets
//   --all: 全部 172 JP sets
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA = resolve(ROOT, 'src', 'data')
const API = 'https://api.tcgdex.net/v2/ja'
const allMode = process.argv.includes('--all')

// TCGdex serie.id → 我们 eras.js 里的 series 名 (现有 era 系统直接复用)
const SERIES_MAP = {
  SV: 'Scarlet & Violet',
  ME: 'Mega Evolution',
  SM: 'Sun & Moon',
  SWSH: 'Sword & Shield',
  XY: 'XY',
  BW: 'Black & White',
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

console.log('Fetching JP sets list from TCGdex...')
const setsList = await fetchJson(`${API}/sets`)
console.log(`  ${setsList.length} total JP sets in TCGdex`)

// list endpoint 没 releaseDate, 用 set id 粗筛 2025-2026 候选 (减少 detail fetch 量)
const yearScope = allMode
  ? setsList
  : setsList.filter((s) => /^(SV(8a|9|9a|10|11|11B|11W)|ME?\d+\w*|M\d+\w*)$/i.test(s.id))
console.log(`  ${yearScope.length} candidates by id pattern`)

await mkdir(DATA, { recursive: true })

const sets = []
const cardsBySet = {}

for (const s of yearScope) {
  process.stdout.write(`  ${s.id.padEnd(8)} ${s.name} ... `)
  try {
    const detail = await fetchJson(`${API}/sets/${s.id}`)
    const rd = detail.releaseDate
    if (!allMode && (!rd || rd < '2025-01-01' || rd > '2026-12-31')) {
      console.log(`skip ${rd || '(no date)'}`)
      continue
    }
    const setId = s.id.toLowerCase()
    const series = SERIES_MAP[detail.serie?.id] || detail.serie?.name || 'Other'
    sets.push({
      id: setId,
      name: detail.name,
      series,
      seriesId: detail.serie?.id || '',
      printedTotal: detail.cardCount?.official || 0,
      total: detail.cardCount?.total || detail.cardCount?.official || 0,
      ptcgoCode: s.id,
      releaseDate: detail.releaseDate?.replace(/-/g, '/') || '',
      logo: detail.logo || '',
      symbol: detail.symbol || '',
      tcgdex: true,
    })
    cardsBySet[setId] = (detail.cards || []).map((c) => ({
      id: `${setId}-${c.localId}`,
      name: c.name,
      number: c.localId,
      img: c.image ? `${c.image}/low.webp` : null,
      imgLarge: c.image ? `${c.image}/high.webp` : null,
      setId,
    }))
    console.log(`${detail.cards?.length || 0} cards ✓`)
  } catch (e) {
    console.log(`fail: ${e.message}`)
  }
  await new Promise((r) => setTimeout(r, 150))
}

// 按 releaseDate 倒序
sets.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))

await writeFile(resolve(DATA, 'jp-sets.json'), JSON.stringify(sets, null, 2))
await writeFile(resolve(DATA, 'jp-cards.json'), JSON.stringify(cardsBySet))

const cardsTotal = Object.values(cardsBySet).reduce((s, a) => s + a.length, 0)
const jsonSize = (JSON.stringify(cardsBySet).length / 1024).toFixed(0)
console.log(`\n${sets.length} sets, ${cardsTotal} cards`)
console.log(`  → src/data/jp-sets.json`)
console.log(`  → src/data/jp-cards.json (${jsonSize} KB)`)
