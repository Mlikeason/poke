// 日文 catalog 的 set 数据 (mode='jp' 时使用).
// 完整 JP 爬虫还没做, 先手工列你拥有的几个. 每加一个就多支持一个 JP set.

export const JP_SETS = [
  {
    id: 'm1l',
    name: 'Mega Brave',
    series: 'Mega Evolution',
    printedTotal: 56,
    total: 64,
    ptcgoCode: 'M1L',
    releaseDate: '2025/05/02',
    symbol: '',
    logo: '',
    custom: true,
  },
]

// JP catalog 的 chase / popular / era 配置可以慢慢加, 现在 JP_SETS 才一个
export const JP_POPULAR_SETS = ['m1l']
export const JP_HOME_POPULAR = ['m1l']

// 生成占位卡 (没有 JP cards API 数据时)
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
