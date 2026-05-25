// 所有展示价格都用新币 (SGD). 数据源是 USD (pokemontcg.io / TCGPlayer).
// 汇率人工维护, 不依赖外网. 2025 年大致 1 USD ≈ 1.35 SGD.
export const USD_TO_SGD = 1.35

// 没价格的卡默认按 1 SGD 算, 折成 USD 存储
export const DEFAULT_SGD = 1
export const DEFAULT_USD = DEFAULT_SGD / USD_TO_SGD

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

// 一张卡的"有效价" USD: customPrice > 抓的市场价 > 默认 1 SGD
export function effectiveUsd(cardId, customPrices, prices) {
  const v = customPrices?.[cardId] ?? prices?.[cardId]
  return v != null ? v : DEFAULT_USD
}

// 用于判断是不是 fallback 默认价
export function isDefaultPrice(cardId, customPrices, prices) {
  return customPrices?.[cardId] == null && prices?.[cardId] == null
}
