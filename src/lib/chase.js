// Chase cards 判定: 一个 set 里收藏者最想要的几张, 一般是顶级稀有度.
// 后续可以用更复杂逻辑 (排名/价格) 替换.
const CHASE_RARITIES = new Set([
  'Special Illustration Rare',
  'Hyper Rare',
  'Illustration Rare',
  'Rare Secret',
  'Rare Rainbow',
  'Rare Shiny',
  'Rare Shiny GX',
  'Rare Holo Star',
  'ACE SPEC Rare',
  'Shiny Rare',
  'Shiny Ultra Rare',
])

export function isChase(card) {
  return CHASE_RARITIES.has(card?.rarity)
}
