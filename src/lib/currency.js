// 所有展示价格都用新币 (SGD). 数据源是 USD (pokemontcg.io / TCGPlayer).
// 汇率人工维护, 不依赖外网. 2025 年大致 1 USD ≈ 1.35 SGD.
export const USD_TO_SGD = 1.35

export function usdToSgd(usd) {
  if (usd == null || isNaN(usd)) return null
  return usd * USD_TO_SGD
}

export function formatSgd(usd) {
  const sgd = usdToSgd(usd)
  if (sgd == null) return '—'
  if (sgd >= 100) return `S$${Math.round(sgd).toLocaleString()}`
  if (sgd >= 10) return `S$${sgd.toFixed(1)}`
  return `S$${sgd.toFixed(2)}`
}
