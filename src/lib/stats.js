// 统计计算 (基于 collection state + sets 元数据)
import { ERAS, eraForSeries } from './eras.js'

export function totalCardsInSets(sets) {
  return sets.reduce((sum, s) => sum + (s.total || 0), 0)
}

// 不重复卡片数(每张卡 owned >= 1 算 1)
export function uniqueOwnedCount(cards) {
  return Object.values(cards).filter((c) => c.owned > 0).length
}

// 总张数(包括重复)
export function totalOwnedCount(cards) {
  return Object.values(cards).reduce((s, c) => s + (c.owned || 0), 0)
}

export function wantedCount(cards) {
  return Object.values(cards).filter((c) => c.wanted).length
}

// 估价: customPrices 优先, 否则用 API 抓的 prices
export function estimatedValue(cards, customPrices, prices) {
  let usd = 0
  for (const [id, entry] of Object.entries(cards)) {
    if (!entry.owned) continue
    const p = customPrices[id] ?? prices?.[id]
    if (p) usd += p * entry.owned
  }
  return usd
}

// 按系列 set id 算已收集 unique 数量。需要知道每个 setId 下有哪些卡,
// 但 sets.json 只有 total,不知道具体 cardId 前缀。约定: cardId 形如 `${setId}-${num}`
// 所以可以快速 prefix 匹配
export function ownedInSet(cards, setId) {
  let n = 0
  const prefix = setId + '-'
  for (const [id, entry] of Object.entries(cards)) {
    if (entry.owned > 0 && id.startsWith(prefix)) n++
  }
  return n
}

// 按 era 汇总: { eraId: { owned, total } }
export function statsByEra(sets, cards) {
  const out = {}
  for (const e of ERAS) out[e.id] = { owned: 0, total: 0 }
  // 给每个 set 累计 total 和 owned
  for (const s of sets) {
    const eid = eraForSeries(s.series)
    if (!out[eid]) continue
    out[eid].total += s.total || 0
    out[eid].owned += ownedInSet(cards, s.id)
  }
  return out
}
