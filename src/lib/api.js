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
      printedTotal: c.set?.printedTotal || c.set?.total,
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

// 遍历所有已缓存的 set, 找所有匹配某个 number 的卡 (按 number 字符串比较, 去前导零).
// 返回 [{ card, setId }, ...]
export function findCardsByNumber(number) {
  const results = []
  const targetNum = String(parseInt(number, 10))
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(CACHE_PREFIX)) continue
    const setId = k.slice(CACHE_PREFIX.length)
    try {
      const parsed = JSON.parse(localStorage.getItem(k))
      if (!parsed?.cards) continue
      for (const card of parsed.cards) {
        const cardNum = String(parseInt(card.number, 10))
        if (cardNum === targetNum) {
          results.push({ card, setId })
        }
      }
    } catch {}
  }
  return results
}

// 用 number + total 精确匹配: total 是 set 的 printedTotal (卡上印的数字), number 是卡在这个 set 里的编号.
// sets: 来自 useSets() 的 set 列表 (有 total 和 printedTotal 字段).
// 同时匹配 total 和 printedTotal，因为卡上印的是 printedTotal，但有些 set 两者相同.
// 返回 [{ card, setId }, ...]
export function findCardsByNumberAndTotal(number, total, sets) {
  const targetNum = String(parseInt(number, 10))
  const targetTotal = String(parseInt(total, 10))
  const matchingSets = (sets || []).filter(
    (s) => String(s.printedTotal) === targetTotal || String(s.total) === targetTotal
  )
  if (matchingSets.length === 0) return []

  const results = []
  for (const set of matchingSets) {
    const key = CACHE_PREFIX + set.id
    try {
      const parsed = JSON.parse(localStorage.getItem(key))
      if (!parsed?.cards) continue
      for (const card of parsed.cards) {
        const cardNum = String(parseInt(card.number, 10))
        const cardNumRaw = card.number
        if (cardNum === targetNum || cardNumRaw === number) {
          results.push({ card, setId: set.id })
        }
      }
    } catch {}
  }
  return results
}

// API fallback: fetch card info from pokemontcg.io when localStorage cache misses
export async function fetchCardByNumberAndTotal(number, total, sets) {
  const targetTotal = String(parseInt(total, 10))
  const matchingSets = (sets || []).filter(
    (s) => String(s.printedTotal) === targetTotal || String(s.total) === targetTotal
  )
  if (matchingSets.length === 0) return []

  const results = []
  for (const set of matchingSets) {
    try {
      const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(set.id)} AND number:${encodeURIComponent(number)}&pageSize=10`
      const res = await fetch(url)
      if (!res.ok) continue
      const json = await res.json()
      if (!json.data) continue

      for (const card of json.data) {
        const cardNum = String(parseInt(card.number, 10))
        const cardNumRaw = card.number
        if (cardNum === String(parseInt(number, 10)) || cardNumRaw === number) {
          results.push({
            card: {
              id: card.id,
              name: card.name,
              number: card.number,
              rarity: card.rarity || '',
              types: card.types || [],
              supertype: card.supertype,
              subtypes: card.subtypes || [],
              hp: card.hp || null,
              img: card.images?.small,
              imgLarge: card.images?.large,
              price: pickPrice(card),
              setId: set.id,
              printedTotal: card.set?.printedTotal || card.set?.total,
            },
            setId: set.id,
          })
        }
      }
    } catch (e) {
      console.warn('API fallback failed for set', set.id, e)
    }
  }
  return results
}

// Format card number with leading zeros (e.g., "16" -> "016/094")
export function formatCardNumber(card) {
  if (!card?.number) return ''
  const num = card.number
  const total = card.printedTotal

  // If number already contains slash (e.g., "SV1"), return as-is
  if (num.includes('/') || num.includes('SV')) return num

  // Pad number with leading zeros based on printedTotal
  if (total) {
    const padLen = String(total).length
    const paddedNum = String(parseInt(num, 10)).padStart(padLen, '0')
    return `${paddedNum}/${total}`
  }

  // Fallback: just pad to 3 digits if we don't know total
  return String(parseInt(num, 10)).padStart(3, '0')
}
