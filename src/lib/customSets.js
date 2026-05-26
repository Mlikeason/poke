// JP catalog 数据.
// jp-sets.json + jp-cards.json: TCGdex 抓取 (scripts/fetch-jp-tcgdex.js)
// MANUAL_SETS: TCGdex 还没有的 set (新发布/未来发布), 用占位卡片
import scrapedSets from '../data/jp-sets.json'
import scrapedCards from '../data/jp-cards.json'

// TCGdex 暂无的 set 在这里手补 (用占位卡)
const MANUAL_SETS = [
  {
    id: 'sv8a',
    name: 'Terastal Festival ex',
    series: 'Scarlet & Violet',
    printedTotal: 87,
    total: 196,
    ptcgoCode: 'SV8A',
    releaseDate: '2024/12/06',
    custom: true,
  },
  {
    id: 'm2a',
    name: 'Mega Dream',
    series: 'Mega Evolution',
    printedTotal: 80,
    total: 100,
    ptcgoCode: 'M2A',
    releaseDate: '2025/11/28',
    custom: true,
  },
  {
    id: 'm4',
    name: 'Ninja Spinner',
    series: 'Mega Evolution',
    printedTotal: 80,
    total: 100,
    ptcgoCode: 'M4',
    releaseDate: '2026/03/27',
    custom: true,
  },
  {
    id: 'm5',
    name: 'Abyss Eye',
    series: 'Mega Evolution',
    printedTotal: 80,
    total: 100,
    ptcgoCode: 'M5',
    releaseDate: '2026/05/22',
    custom: true,
  },
  {
    id: 'm6',
    name: 'Storm Emeralda',
    series: 'Mega Evolution',
    printedTotal: 80,
    total: 100,
    ptcgoCode: 'M6',
    releaseDate: '2026/07/31',
    custom: true,
  },
]

// 合并 (scraped 优先, 同 id 时不重复)
const seen = new Set(scrapedSets.map((s) => s.id))
export const JP_SETS = [...scrapedSets, ...MANUAL_SETS.filter((s) => !seen.has(s.id))]

// Popular / Home Popular 自动用 JP_SETS 全部, 按发布日期排
const sortedIds = [...JP_SETS]
  .sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : 1))
  .map((s) => s.id)

export const JP_HOME_POPULAR = sortedIds.slice(-8).reverse()
export const JP_POPULAR_SETS = [...sortedIds].reverse()

// 真实卡片 (TCGdex 来的) > 占位编号 (MANUAL_SETS 用)
export function getJpCardsForSet(setId) {
  const real = scrapedCards[setId]
  if (real && real.length) {
    return real.map((c) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      rarity: c.rarity || '',
      types: c.types || [],
      supertype: c.supertype || '',
      subtypes: c.subtypes || [],
      hp: c.hp || null,
      img: c.img,
      imgLarge: c.imgLarge,
      price: null,
      setId: c.setId || setId,
    }))
  }

  // 占位
  const set = JP_SETS.find((s) => s.id === setId)
  if (!set) return null
  const cards = []
  for (let i = 1; i <= (set.total || set.printedTotal || 1); i++) {
    cards.push({
      id: `${setId}-${i}`,
      name: `Card ${i}`,
      number: String(i),
      rarity: '',
      types: [],
      supertype: '',
      subtypes: [],
      hp: null,
      img: null,
      imgLarge: null,
      price: null,
      setId,
    })
  }
  return cards
}

export function isJpSet(setId) {
  return JP_SETS.some((s) => s.id === setId)
}
