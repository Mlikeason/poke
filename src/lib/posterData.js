// 为分享海报聚合数据: 总 owned / 总价值 / wanted / top 6 高价 owned 卡 (带图).
import { uniqueOwnedCount, wantedCount, estimatedValue } from './stats.js'
import { priceFor } from './collection.js'

function setIdOf(cardId) {
  const i = cardId.lastIndexOf('-')
  return i < 0 ? cardId : cardId.substring(0, i)
}

// 从 localStorage 缓存里捞某个 set 的 card 对象 (含 img)
function getCachedCard(cardId) {
  const setId = setIdOf(cardId)
  try {
    const raw = localStorage.getItem('poke.cards.v1.' + setId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const cards = parsed?.cards
    if (!Array.isArray(cards)) return null
    return cards.find((c) => c && c.id === cardId) || null
  } catch {
    return null
  }
}

export function buildPosterData(col, sets) {
  const cards = col?.cards || {}
  const owned = uniqueOwnedCount(cards)
  const valueUsd = estimatedValue(cards, col?.customPrices || {}, col?.prices || {})
  const wanted = wantedCount(cards)

  // top 6 高价 owned 卡 (按 priceFor 降序)
  const ownedIds = Object.entries(cards)
    .filter(([_, v]) => (v.owned || 0) > 0)
    .map(([id, v]) => ({ id, price: priceFor(id) ?? 0, owned: v.owned || 0 }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 6)

  const topCards = ownedIds
    .map(({ id, price, owned: n }) => {
      const cached = getCachedCard(id)
      if (!cached) return null
      return {
        id,
        name: cached.name || id,
        number: cached.number || '',
        rarity: cached.rarity || '',
        img: cached.img || null,
        price,
        owned: n,
      }
    })
    .filter(Boolean)

  // 计算日期字符串: YYYY.MM.DD
  const now = new Date()
  const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

  return { owned, valueUsd, wanted, topCards, date }
}
