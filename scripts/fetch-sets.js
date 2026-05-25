#!/usr/bin/env node
// 一次性脚本: 从 pokemontcg.io 拉所有 sets, 排序后写到 public/sets.json
// 用法: node scripts/fetch-sets.js
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'sets.json')

const url = 'https://api.pokemontcg.io/v2/sets?pageSize=500&orderBy=releaseDate'
console.log('Fetching', url)
const res = await fetch(url)
if (!res.ok) {
  console.error('API error', res.status, await res.text())
  process.exit(1)
}
const json = await res.json()
const sets = json.data
  .map(s => ({
    id: s.id,
    name: s.name,
    series: s.series,
    printedTotal: s.printedTotal,
    total: s.total,
    ptcgoCode: s.ptcgoCode,
    releaseDate: s.releaseDate,
    symbol: s.images?.symbol,
    logo: s.images?.logo,
  }))
  .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1)) // newest first

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(sets, null, 2))
console.log(`Wrote ${sets.length} sets to ${OUT}`)

// 顺便统计 series 分布,方便手工归并 eras
const bySeries = sets.reduce((m, s) => ((m[s.series] = (m[s.series] || 0) + 1), m), {})
console.log('\nseries distribution:')
Object.entries(bySeries)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`  ${v.toString().padStart(3)}  ${k}`))
