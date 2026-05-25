// 主页 "Popular Sets" 模块的 set 候选名单. App 会按 releaseDate 自动倒序排,
// 首页只显示前 6 个, 其余进 /popular 页. 增减名单只改这里.
export const POPULAR_SETS = [
  'me4', // Chaos Rising         2026-05-22
  'me3', // Perfect Order         2026-03-27
  'me2pt5', // Ascended Heroes    2026-01-30
  'me2', // Phantasmal Flames    2025-11-14
  'zsv10pt5', // Black Bolt       2025-07-18
  'rsv10pt5', // White Flare      2025-07-18
  'sv10', // Destined Rivals     2025-05-30
  'sv8pt5', // Prismatic Evolutions 2025-01-17
  'sv4pt5', // Paldean Fates     2024-01-26
  'sv3pt5', // 151                2023-09-22
  'swsh12pt5', // Crown Zenith   2023-01-20
  // Sun & Moon 经典
  'sm12', // Cosmic Eclipse 2019-11
  'sm115', // Hidden Fates 2019-08
  'sm8', // Lost Thunder 2018-11
  'sm35', // Shining Legends 2017-10
  'sm3', // Burning Shadows 2017-08
]

// 首页展示数量, 其余在 /popular
export const POPULAR_HOME_COUNT = 6
