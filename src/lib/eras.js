// 把 pokemontcg.io 的 series 字段归类成"世代"
// recent: 主页置顶, archive: 复古档案区默认折叠
export const ERAS = [
  {
    id: 'mega-evolution',
    name: 'Mega Evolution',
    nameCn: 'Mega 进化',
    years: '2025–2026',
    seriesMatch: ['Mega Evolution'],
    accent: { from: '#ec4899', to: '#a855f7', text: '#fff' },
    emoji: '✨',
    bucket: 'recent',
  },
  {
    id: 'scarlet-violet',
    name: 'Scarlet & Violet',
    nameCn: '朱 / 紫',
    years: '2023–2024',
    seriesMatch: ['Scarlet & Violet'],
    accent: { from: '#dc2626', to: '#7c3aed', text: '#fff' },
    emoji: '🌑',
    bucket: 'recent',
  },
  {
    id: 'sword-shield',
    name: 'Sword & Shield',
    nameCn: '剑 / 盾',
    years: '2020–2022',
    seriesMatch: ['Sword & Shield'],
    accent: { from: '#0ea5e9', to: '#6366f1', text: '#fff' },
    emoji: '⚔️',
    bucket: 'recent',
  },
  {
    id: 'sun-moon',
    name: 'Sun & Moon',
    nameCn: '太阳 / 月亮',
    years: '2017–2019',
    seriesMatch: ['Sun & Moon'],
    accent: { from: '#f59e0b', to: '#ef4444', text: '#fff' },
    emoji: '☀️',
    bucket: 'archive',
  },
  {
    id: 'xy',
    name: 'XY',
    nameCn: 'XY 时代',
    years: '2014–2016',
    seriesMatch: ['XY'],
    accent: { from: '#06b6d4', to: '#3b82f6', text: '#fff' },
    emoji: '⚡',
    bucket: 'archive',
  },
  {
    id: 'bw',
    name: 'Black & White',
    nameCn: '黑 / 白',
    years: '2011–2013',
    seriesMatch: ['Black & White'],
    accent: { from: '#1f2937', to: '#6b7280', text: '#fff' },
    emoji: '⚫',
    bucket: 'archive',
  },
  {
    id: 'hgss',
    name: 'HeartGold & SoulSilver',
    nameCn: '心金 / 魂银',
    years: '2010–2011',
    seriesMatch: ['HeartGold & SoulSilver'],
    accent: { from: '#eab308', to: '#94a3b8', text: '#1f1d2b' },
    emoji: '💛',
    bucket: 'archive',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    nameCn: '白金',
    years: '2009',
    seriesMatch: ['Platinum'],
    accent: { from: '#94a3b8', to: '#475569', text: '#fff' },
    emoji: '🌟',
    bucket: 'archive',
  },
  {
    id: 'dp',
    name: 'Diamond & Pearl',
    nameCn: '钻石 / 珍珠',
    years: '2007–2009',
    seriesMatch: ['Diamond & Pearl'],
    accent: { from: '#60a5fa', to: '#e879f9', text: '#fff' },
    emoji: '💎',
    bucket: 'archive',
  },
  {
    id: 'ex',
    name: 'EX 时代',
    nameCn: 'EX (含 POP 周边)',
    years: '2003–2007',
    seriesMatch: ['EX', 'POP'],
    accent: { from: '#10b981', to: '#0ea5e9', text: '#fff' },
    emoji: '💠',
    bucket: 'archive',
  },
  {
    id: 'ecard',
    name: 'e-Card',
    nameCn: 'e-卡',
    years: '2002–2003',
    seriesMatch: ['E-Card'],
    accent: { from: '#f97316', to: '#facc15', text: '#1f1d2b' },
    emoji: '📇',
    bucket: 'archive',
  },
  {
    id: 'classic',
    name: '经典 (Base / Gym / Neo)',
    nameCn: '初代经典',
    years: '1999–2002',
    seriesMatch: ['Base', 'Gym', 'Neo', 'NP'],
    accent: { from: '#ef4444', to: '#fbbf24', text: '#fff' },
    emoji: '🔴',
    bucket: 'archive',
  },
  {
    id: 'other',
    name: 'Promo & 其他',
    nameCn: '宣传卡 / 杂项',
    years: '各年代',
    seriesMatch: ['Other'],
    accent: { from: '#a78bfa', to: '#f472b6', text: '#fff' },
    emoji: '🎁',
    bucket: 'archive',
  },
]

// 根据 series 字段找所属 era
const seriesIndex = (() => {
  const m = new Map()
  for (const era of ERAS) for (const s of era.seriesMatch) m.set(s, era.id)
  return m
})()

export function eraForSeries(series) {
  return seriesIndex.get(series) || 'other'
}

export function eraById(id) {
  return ERAS.find((e) => e.id === id)
}

// 把 sets 列表分组进 eras
export function groupSetsByEra(sets) {
  const byEra = new Map()
  for (const era of ERAS) byEra.set(era.id, [])
  for (const s of sets) {
    const eid = eraForSeries(s.series)
    byEra.get(eid)?.push(s)
  }
  return byEra
}
