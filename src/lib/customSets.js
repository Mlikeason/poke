// 手工定义的 set (pokemontcg.io API 之外的, 如日文 set).
// 没有 cards 数据时 getCustomCards 生成编号占位.

export const CUSTOM_SETS = [
  {
    id: 'm1l',
    name: 'Mega Brave',
    series: 'Mega Evolution',
    printedTotal: 56,
    total: 64,
    ptcgoCode: 'M1L',
    // 日版第一个 Mega Evolution set, 实际发布日有出入可改
    releaseDate: '2025/05/02',
    symbol: '',
    logo: '',
    custom: true,
  },
]

// 生成占位卡片 (没有 API 数据时)
export function getCustomCards(setId) {
  const set = CUSTOM_SETS.find((s) => s.id === setId)
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

export function isCustomSet(setId) {
  return CUSTOM_SETS.some((s) => s.id === setId)
}
