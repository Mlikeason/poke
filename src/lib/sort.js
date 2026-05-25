// 卡片排序工具, 给 SetPage + MyCardsPage 共用
const RARITY_RANK = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  'Rare Holo': 3,
  'Double Rare': 3,
  'Rare Holo EX': 4,
  'Rare Holo GX': 4,
  'Rare Holo V': 4,
  'Rare Holo VMAX': 5,
  'Rare Holo VSTAR': 5,
  'Rare Ultra': 6,
  'Ultra Rare': 6,
  'Illustration Rare': 6,
  'Rare Shiny': 7,
  'Rare Shiny GX': 7,
  'Shiny Rare': 7,
  'Shiny Ultra Rare': 8,
  'ACE SPEC Rare': 7,
  'Rare Secret': 8,
  'Rare Rainbow': 9,
  'Rare Holo Star': 9,
  'Hyper Rare': 10,
  'Special Illustration Rare': 11,
  'Promo': 2,
}

function rarityRank(r) {
  return RARITY_RANK[r] ?? -1
}

export function sortByNumber(arr) {
  return [...arr].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }),
  )
}

export function sortByRarity(arr) {
  return [...arr].sort((a, b) => {
    const dr = rarityRank(b.rarity) - rarityRank(a.rarity)
    if (dr) return dr
    return a.number.localeCompare(b.number, undefined, { numeric: true })
  })
}
