// 按需拉某 set 的所有卡片, 带 localStorage 缓存
// EN mode 走 pokemontcg.io API (即使 ID 与某个 JP set 撞了也走 EN)
// JP mode 走本地 jp-cards.json
import { mergePrices } from './collection.js'
import { getJpCardsForSet } from './customSets.js'

const CACHE_PREFIX = 'poke.cards.v1.'

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

// mode: 'en' | 'jp' (传入, 避免 module 内部依赖 getMode() 状态)
// EN mode 下即使 setId 与某个 JP set 撞名, 也强制走 pokemontcg.io API
export async function getCardsForSet(setId, mode) {
  if (mode === 'jp') return getJpCardsForSet(setId)

  const key = CACHE_PREFIX + setId
  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.cards) {
        const m = {}
        for (const c of parsed.cards) if (c.price != null) m[c.id] = c.price
        if (Object.keys(m).length) mergePrices(m)
        return parsed.cards
      }
    }
  } catch {}

  const all = []
  let page = 1
  while (true) {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&orderBy=number`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`fetch cards failed: ${res.status}`)
    const json = await res.json()
    all.push(...json.data)
    if (json.data.length < 250) break
    page++
    if (page > 20) break
  }

  const priceMap = {}
  const cards = all.map((c) => {
    const price = pickPrice(c)
    if (price != null) priceMap[c.id] = price
    return {
      id: c.id,
      name: c.name,
      number: c.number,
      rarity: c.rarity || '',
      types: c.types || [],
      supertype: c.supertype,
      subtypes: c.subtypes || [],
      hp: c.hp || null,
      img: c.images?.small,
      imgLarge: c.images?.large,
      price,
      setId,
    }
  })

  mergePrices(priceMap)

  try {
    localStorage.setItem(key, JSON.stringify({ cards, fetchedAt: Date.now() }))
  } catch (e) {
    console.warn('card cache write failed (localStorage quota?)', e)
  }

  return cards
}

export function clearCardCache(setId) {
  if (setId) localStorage.removeItem(CACHE_PREFIX + setId)
  else {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k)
    }
  }
}

// 遍历所有已缓存的 set, 找某张卡 (按 id). 返回 card 对象 或 null
export function findCachedCard(cardId) {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(CACHE_PREFIX)) continue
    try {
      const parsed = JSON.parse(localStorage.getItem(k))
      if (!parsed?.cards) continue
      const card = parsed.cards.find((c) => c.id === cardId)
      if (card) return card
    } catch {}
  }
  return null
}
