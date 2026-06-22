// 全局搜索: set 名 (走已加载的 sets.json) + 卡片 (走 localStorage 缓存, 即用户点开过的 set).
// 没点开过的 set 内的卡搜不到 — 这是有意限制, 避免一次性拉 173 个 set.
import { setCode } from './setCode.js'

const CARD_CACHE_PREFIX = 'poke.cards.v1.'
const MAX_CARDS = 50

export function searchAll(query, sets) {
  const result = { sets: [], cards: [] }
  if (!query || !query.trim()) return result
  const q = query.trim().toLowerCase()

  if (Array.isArray(sets)) {
    const scored = []
    for (const s of sets) {
      const code = setCode(s.id).toLowerCase()
      const name = (s.name || '').toLowerCase()
      const ptcgo = (s.ptcgoCode || '').toLowerCase()
      let score = 0
      if (code === q || ptcgo === q) score = 100
      else if (code.startsWith(q) || ptcgo.startsWith(q)) score = 80
      else if (name.startsWith(q)) score = 60
      else if (code.includes(q) || ptcgo.includes(q)) score = 40
      else if (name.includes(q)) score = 20
      if (score > 0) scored.push({ set: s, score })
    }
    scored.sort((a, b) => b.score - a.score || (a.set.releaseDate < b.set.releaseDate ? 1 : -1))
    result.sets = scored.slice(0, 12).map((x) => x.set)
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(CARD_CACHE_PREFIX)) continue
      const setId = key.substring(CARD_CACHE_PREFIX.length)
      let raw
      try { raw = localStorage.getItem(key) } catch { continue }
      if (!raw) continue
      let parsed
      try { parsed = JSON.parse(raw) } catch { continue }
      const cards = parsed?.cards
      if (!Array.isArray(cards)) continue
      for (const c of cards) {
        if (!c) continue
        const name = (c.name || '').toLowerCase()
        const num = (c.number || '').toLowerCase()
        if (name.includes(q) || num.includes(q)) {
          result.cards.push({ ...c, setId })
          if (result.cards.length >= MAX_CARDS) return result
        }
      }
    }
  } catch {
    // localStorage 不可用 / 配额问题 — 仍返回 set 结果
  }

  return result
}
