#!/usr/bin/env node
// 抓全部 set 的卡片价格, 输出 public/prices.json
// 格式: { "<cardId>": <usd-number> }
// 用法: node scripts/fetch-prices.js
//
// 数据源是 tcgplayer + cardmarket (pokemontcg.io 返回的). 单次运行 ~30s, 文件 ~500KB
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'public', 'prices.json')

function pickPrice(c) {
  const tcg = c.tcgplayer?.prices || {}
  const cm = c.cardmarket?.prices || {}
  const candidates = [
    tcg.normal?.market,
    tcg.holofoil?.market,
    tcg['1stEditionHolofoil']?.market,
    tcg.reverseHolofoil?.market,
    tcg.normal?.mid,
    tcg.holofoil?.mid,
    cm.trendPrice,
    cm.averageSellPrice,
  ]
  for (const v of candidates) {
    if (typeof v === 'number' && v > 0 && v < 9999) return v
  }
  return null
}

async function fetchCardsForSet(setId) {
  const all = []
  let page = 1
  while (true) {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&select=id,tcgplayer,cardmarket`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API ${res.status} for ${setId}`)
    const json = await res.json()
    all.push(...json.data)
    if (json.data.length < 250) break
    page++
    if (page > 20) break
  }
  return all
}

const sets = JSON.parse(await readFile(resolve(ROOT, 'public', 'sets.json'), 'utf8'))
console.log(`Fetching prices for ${sets.length} sets...`)

const prices = {}
let total = 0
let okSets = 0
let failSets = 0

for (let i = 0; i < sets.length; i++) {
  const set = sets[i]
  process.stdout.write(`  [${i + 1}/${sets.length}] ${set.id.padEnd(10)} `)
  try {
    const cards = await fetchCardsForSet(set.id)
    let n = 0
    for (const c of cards) {
      const p = pickPrice(c)
      if (p != null) {
        prices[c.id] = Math.round(p * 100) / 100 // 2 decimal
        n++
      }
    }
    total += n
    okSets++
    console.log(`${cards.length} cards, ${n} priced`)
  } catch (e) {
    failSets++
    console.log(`FAIL: ${e.message}`)
  }
  // 礼貌延迟
  await new Promise((r) => setTimeout(r, 100))
}

await writeFile(OUT, JSON.stringify(prices))
console.log(`\nWrote ${total} prices across ${okSets} sets (${failSets} failed) → ${OUT}`)
console.log(`File size: ${((JSON.stringify(prices).length) / 1024).toFixed(0)} KB`)
