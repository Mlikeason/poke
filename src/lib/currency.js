// 所有价格源数据都是 USD (pokemontcg.io / TCGPlayer).
// 默认显示 USD, 用户可在 Settings 切到 SGD (汇率固定 1.35).
import { useEffect, useState } from 'react'

export const USD_TO_SGD = 1.35

// 没价格的卡默认按 1 SGD 算, 折成 USD 存储 (供统计兜底)
export const DEFAULT_SGD = 1
export const DEFAULT_USD = DEFAULT_SGD / USD_TO_SGD

const KEY = 'poke.currency'
const listeners = new Set()

function readPref() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'sgd' ? 'sgd' : 'usd'
  } catch {
    return 'usd'
  }
}

let current = readPref()

export function getCurrency() {
  return current
}

export function setCurrency(c) {
  if (c !== 'usd' && c !== 'sgd') return
  if (c === current) return
  current = c
  try { localStorage.setItem(KEY, c) } catch {}
  for (const fn of listeners) fn(c)
}

export function useCurrency() {
  const [c, set] = useState(current)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return [c, setCurrency]
}

export function usdToSgd(usd) {
  if (usd == null || isNaN(usd)) return null
  return usd * USD_TO_SGD
}

export function formatUsd(usd) {
  if (usd == null || isNaN(usd)) return '—'
  if (usd >= 100) return `$${Math.round(usd).toLocaleString()}`
  if (usd >= 10) return `$${usd.toFixed(1)}`
  if (usd > 0) return `$${usd.toFixed(2)}`
  return '—'
}

export function formatSgd(usd) {
  const sgd = usdToSgd(usd)
  if (sgd == null) return '—'
  if (sgd >= 100) return `S$${Math.round(sgd).toLocaleString()}`
  if (sgd >= 10) return `S$${sgd.toFixed(1)}`
  return `S$${sgd.toFixed(2)}`
}

// 根据用户偏好格式化价格 (默认 USD)
export function formatPrice(usd) {
  return current === 'sgd' ? formatSgd(usd) : formatUsd(usd)
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
