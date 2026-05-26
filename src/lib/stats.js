// 统计计算 (基于 collection state + sets 元数据). 单 owned 计数, 不再 en+jp 双.
import { ERAS, eraForSeries } from './eras.js'
import { DEFAULT_USD } from './currency.js'

export function totalCardsInSets(sets) {
  return sets.reduce((sum, s) => sum + (s.total || 0), 0)
}

export function uniqueOwnedCount(cards) {
  return Object.values(cards).filter((c) => (c.owned || 0) > 0).length
}

export function totalOwnedCount(cards) {
  return Object.values(cards).reduce((s, c) => s + (c.owned || 0), 0)
}

export function wantedCount(cards) {
  return Object.values(cards).filter((c) => c.wanted).length
}

export function estimatedValue(cards, customPrices, prices) {
  let usd = 0
  for (const [id, entry] of Object.entries(cards)) {
    const n = entry?.owned || 0
    if (!n) continue
    const p = customPrices[id] ?? prices?.[id] ?? DEFAULT_USD
    usd += p * n
  }
  return usd
}

export function ownedInSet(cards, setId) {
  let n = 0
  const prefix = setId + '-'
  for (const [id, entry] of Object.entries(cards)) {
    if (id.startsWith(prefix) && (entry.owned || 0) > 0) n++
  }
  return n
}

export function statsByEra(sets, cards) {
  const out = {}
  for (const e of ERAS) out[e.id] = { owned: 0, total: 0 }
  for (const s of sets) {
    const eid = eraForSeries(s.series)
    if (!out[eid]) continue
    out[eid].total += s.total || 0
    out[eid].owned += ownedInSet(cards, s.id)
  }
  return out
}
