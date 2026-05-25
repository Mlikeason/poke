// localStorage 持久化层 + 简单的订阅机制
// v1 cardEntry: { owned: N, wanted: bool }   (旧版)
// v1 cardEntry: { en: N, jp: N, wanted: bool } (新版, 双语)
// 旧 owned 字段自动迁移到 en
const KEY = 'poke.collection.v1'

const emptyState = () => ({
  version: 1,
  cards: {}, // cardId -> { en: 0, jp: 0, wanted: false }
  packs: {},
  customPrices: {},
  prices: {},
})

// 兼容老数据: { owned: N } → { en: N, jp: 0 }
function migrateEntry(e) {
  if (!e) return { en: 0, jp: 0, wanted: false }
  if (e.owned !== undefined && e.en === undefined) {
    return { en: e.owned, jp: 0, wanted: !!e.wanted, ...(e.notes ? { notes: e.notes } : {}) }
  }
  return { en: e.en || 0, jp: e.jp || 0, wanted: !!e.wanted, ...(e.notes ? { notes: e.notes } : {}) }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const data = JSON.parse(raw)
    if (!data || data.version !== 1) return emptyState()
    // 迁移所有 card entry
    const cards = {}
    for (const [id, e] of Object.entries(data.cards || {})) {
      cards[id] = migrateEntry(e)
    }
    return { ...emptyState(), ...data, cards }
  } catch {
    return emptyState()
  }
}

let state = load()
const listeners = new Set()

function persist() {
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
  return state.cards[cardId] || { en: 0, jp: 0, wanted: false }
}

// lang = 'en' | 'jp'
export function setOwned(cardId, n, lang = 'en') {
  const v = Math.max(0, Math.floor(n))
  const cur = getCardEntry(cardId)
  state.cards = { ...state.cards, [cardId]: { ...cur, [lang]: v } }
  persist()
}

export function incOwned(cardId, delta, lang = 'en') {
  const cur = getCardEntry(cardId)
  setOwned(cardId, (cur[lang] || 0) + delta, lang)
}

export function toggleWanted(cardId) {
  const cur = getCardEntry(cardId)
  state.cards = {
    ...state.cards,
    [cardId]: { ...cur, wanted: !cur.wanted },
  }
  persist()
}

export function priceFor(cardId) {
  return state.customPrices[cardId] ?? state.prices[cardId] ?? null
}

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
  const cards = {}
  for (const [id, e] of Object.entries(parsed.cards || {})) {
    cards[id] = migrateEntry(e)
  }
  state = { ...emptyState(), ...parsed, cards, version: 1 }
  persist()
}

export function reset() {
  state = emptyState()
  persist()
}

// 工具: 一张卡的总持有数 (en + jp)
export function totalOwned(entry) {
  return (entry?.en || 0) + (entry?.jp || 0)
}
