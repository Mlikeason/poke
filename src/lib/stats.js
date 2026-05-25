// 统计计算 (基于 collection state + sets 元数据)
import { ERAS, eraForSeries } from './eras.js'
import { DEFAULT_USD } from './currency.js'

// 一张卡的总持有 (EN + JP)
function totalForEntry(e) {
  return (e?.en || 0) + (e?.jp || 0)
}

export function totalCardsInSets(sets) {
  return sets.reduce((sum, s) => sum + (s.total || 0), 0)
}

// 不重复卡片数 (任一语言版本拥有 1 张以上即算 1)
export function uniqueOwnedCount(cards) {
  return Object.values(cards).filter((c) => totalForEntry(c) > 0).length
}

// 总张数 (EN+JP 全部加起来)
export function totalOwnedCount(cards) {
  return Object.values(cards).reduce((s, c) => s + totalForEntry(c), 0)
}

export function wantedCount(cards) {
  return Object.values(cards).filter((c) => c.wanted).length
}

// 估价 (USD): EN+JP 同价 (用户偏好), customPrices > API > 默认 1 SGD
export function estimatedValue(cards, customPrices, prices) {
  let usd = 0
  for (const [id, entry] of Object.entries(cards)) {
    const n = totalForEntry(entry)
    if (!n) continue
    const p = customPrices[id] ?? prices?.[id] ?? DEFAULT_USD
    usd += p * n
  }
  return usd
}

// 已拥有的 unique 卡数, 局限到某 setId 前缀
export function ownedInSet(cards, setId) {
  let n = 0
  const prefix = setId + '-'
  for (const [id, entry] of Object.entries(cards)) {
    if (id.startsWith(prefix) && totalForEntry(entry) > 0) n++
  }
  return n
}

// { eraId: { owned, total } }
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
