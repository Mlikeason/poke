// JP catalog 数据: 从 src/data/jp-sets.json 加载 (由 scripts/fetch-jp-sets.js 生成)
// 现在 mode='jp' 时 app 会看到这个列表里所有 set
import scrapedSets from '../data/jp-sets.json'

// card-binder 缺/不全的 set 在这里手补
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
    id: 'm4',
    // 真实名字 / 数据卡片图待补 (card-binder 没上架)
    name: 'M4 (TBD)',
    series: 'Mega Evolution',
    printedTotal: 80,
    total: 100,
    ptcgoCode: 'M4',
    releaseDate: '2026/03/27', // m3 (1月) 和 m5 (5月) 之间的估计
    custom: true,
  },
]

export const JP_SETS = [...scrapedSets, ...MANUAL_SETS]

// Popular / Home Popular 自动用 JP_SETS 全部, 按发布日期排
const sortedIds = [...JP_SETS]
  .sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : 1))
  .map((s) => s.id)

// 最新的几个放 home, 其余进 Sets 页
export const JP_HOME_POPULAR = sortedIds.slice(-8).reverse() // 最新 8 个, 倒序展示
export const JP_POPULAR_SETS = [...sortedIds].reverse() // 全部, 最新优先

// 生成占位卡 (没有 JP cards 真实数据时, 用编号占位)
export function getJpCardsForSet(setId) {
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
