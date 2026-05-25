// localStorage 持久化层 + 简单的订阅机制,让组件能响应变化
const KEY = 'poke.collection.v1'

const emptyState = () => ({
  version: 1,
  cards: {}, // cardId -> { owned: number, wanted: bool, notes?: string }
  packs: {}, // packId -> { owned, opened, paidPrice }
  customPrices: {}, // cardId -> number (USD), 用户手动覆盖
  prices: {}, // cardId -> number (USD), 从 API 抓的市场价缓存
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const data = JSON.parse(raw)
    if (!data || data.version !== 1) return emptyState()
    return { ...emptyState(), ...data }
  } catch {
    return emptyState()
  }
}

let state = load()
const listeners = new Set()

function persist() {
  // 每次都给 state 一个新引用, 让 React useState 的 bailout 不会跳过 rerender
  state = { ...state }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.error('localStorage write failed', e)
  }
  for (const l of listeners) l(state)
}

export function getState() {
  return state
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getCardEntry(cardId) {
  return state.cards[cardId] || { owned: 0, wanted: false }
}

export function setOwned(cardId, n) {
  const owned = Math.max(0, Math.floor(n))
  const cur = state.cards[cardId] || { owned: 0, wanted: false }
  state.cards = { ...state.cards, [cardId]: { ...cur, owned } }
  persist()
}

export function incOwned(cardId, delta) {
  const cur = getCardEntry(cardId)
  setOwned(cardId, cur.owned + delta)
}

export function toggleWanted(cardId) {
  const cur = getCardEntry(cardId)
  state.cards = {
    ...state.cards,
    [cardId]: { ...cur, wanted: !cur.wanted },
  }
  persist()
}

// 取一张卡的最终价格 (用户手动 > API 抓的)
export function priceFor(cardId) {
  return state.customPrices[cardId] ?? state.prices[cardId] ?? null
}

// 批量合并 API 抓的价格 (api.js 调用)
export function mergePrices(map) {
  if (!map || !Object.keys(map).length) return
  const next = { ...state.prices }
  let changed = false
  for (const [id, v] of Object.entries(map)) {
    if (typeof v === 'number' && next[id] !== v) {
      next[id] = v
      changed = true
    }
  }
  if (changed) {
    state.prices = next
    persist()
  }
}

export function setCustomPrice(cardId, usd) {
  if (!usd && usd !== 0) {
    const { [cardId]: _, ...rest } = state.customPrices
    state.customPrices = rest
  } else {
    state.customPrices = { ...state.customPrices, [cardId]: Number(usd) }
  }
  persist()
}

export function exportJson() {
  return JSON.stringify(state, null, 2)
}

export function importJson(text) {
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('格式不对')
  state = { ...emptyState(), ...parsed, version: 1 }
  persist()
}

export function reset() {
  state = emptyState()
  persist()
}
