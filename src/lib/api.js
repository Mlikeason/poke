// 按需拉某 set 的所有卡片, 带 localStorage 缓存
import { mergePrices } from './collection.js'

const CACHE_PREFIX = 'poke.cards.v1.'

// 从 API 的复杂 price 结构中挑一个稳的市场价 (USD)
function pickPrice(c) {
  const tcg = c.tcgplayer?.prices || {}
  const cm = c.cardmarket?.prices || {}
  // 优先顺序: tcgplayer normal market > holofoil > reverseHolofoil > cardmarket trend
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

export async function getCardsForSet(setId) {
  const key = CACHE_PREFIX + setId
  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.cards) {
        // 把已缓存卡的价格回灌一次, 确保 collection state 拿得到
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
    console.warn('卡片数据缓存失败 (可能超出 localStorage 配额)', e)
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
