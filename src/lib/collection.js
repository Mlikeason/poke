// EN 和 JP 各自独立的 collection 数据库 (separate localStorage keys)
// 切 mode → 整个 state 替换成那个 mode 的数据, listeners 自动收到通知
import { getMode, onModeChange } from './mode.js'

const KEY_PREFIX = 'poke.collection.'
const VERSION = 1

const emptyState = () => ({
  version: VERSION,
  cards: {}, // cardId -> { owned: N, wanted: bool }
  packs: {},
  customPrices: {},
  prices: {},
})

// 把旧 { en, jp, wanted } 或更老的 { owned, wanted } 标准化成 { owned, wanted }
// 老的 jp 字段已经按计划丢弃
function normalizeEntry(e) {
  if (!e) return { owned: 0, wanted: false }
  const owned = e.owned !== undefined ? e.owned : e.en !== undefined ? e.en : 0
  return {
    owned: Math.max(0, Math.floor(owned)),
    wanted: !!e.wanted,
    ...(e.notes ? { notes: e.notes } : {}),
  }
}

function loadFor(mode) {
  // mode='en': 优先读旧 key poke.collection.v1 (向前兼容一次性迁移); 之后读新 key
  // mode='jp': 全新空数据库
  const newKey = KEY_PREFIX + mode + '.v1'
  try {
    let raw = localStorage.getItem(newKey)
    if (!raw && mode === 'en') {
      // 一次性迁移: 老的统一 key 把数据搬到 EN
      raw = localStorage.getItem('poke.collection.v1')
      if (raw) {
        const old = JSON.parse(raw)
        if (old && old.version === VERSION) {
          const cards = {}
          for (const [id, e] of Object.entries(old.cards || {})) cards[id] = normalizeEntry(e)
          const data = { ...emptyState(), ...old, cards }
          localStorage.setItem(newKey, JSON.stringify(data))
          return data
        }
      }
    }
    if (!raw) return emptyState()
    const data = JSON.parse(raw)
    if (!data || data.version !== VERSION) return emptyState()
    const cards = {}
    for (const [id, e] of Object.entries(data.cards || {})) cards[id] = normalizeEntry(e)
    return { ...emptyState(), ...data, cards }
  } catch {
    return emptyState()
  }
}

let mode = getMode()
let state = loadFor(mode)
const listeners = new Set()

// mode 切换时, 整个 state 重新加载 + 通知
onModeChange((m) => {
  mode = m
  state = loadFor(m)
  for (const l of listeners) l(state)
})

function persist() {
  state = { ...state }
  try {
    localStorage.setItem(KEY_PREFIX + mode + '.v1', JSON.stringify(state))
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
  const cur = getCardEntry(cardId)
  state.cards = { ...state.cards, [cardId]: { ...cur, owned } }
  persist()
}

export function incOwned(cardId, delta) {
  const cur = getCardEntry(cardId)
  setOwned(cardId, cur.owned + delta)
}

export function toggleWanted(cardId) {
  const cur = getCardEntry(cardId)
  state.cards = { ...state.cards, [cardId]: { ...cur, wanted: !cur.wanted } }
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
  // 导出当前 mode + 另一个 mode 全部, 方便备份
  const all = { mode, ...{} }
  try {
    all.en = JSON.parse(localStorage.getItem(KEY_PREFIX + 'en.v1') || 'null')
    all.jp = JSON.parse(localStorage.getItem(KEY_PREFIX + 'jp.v1') || 'null')
  } catch {}
  return JSON.stringify(all, null, 2)
}

export function importJson(text) {
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('format invalid')
  // 双 mode 备份格式 { mode, en, jp }
  if (parsed.en || parsed.jp) {
    if (parsed.en) localStorage.setItem(KEY_PREFIX + 'en.v1', JSON.stringify(parsed.en))
    if (parsed.jp) localStorage.setItem(KEY_PREFIX + 'jp.v1', JSON.stringify(parsed.jp))
  } else {
    // 旧格式 (单 collection) 视为当前 mode
    const cards = {}
    for (const [id, e] of Object.entries(parsed.cards || {})) cards[id] = normalizeEntry(e)
    localStorage.setItem(
      KEY_PREFIX + mode + '.v1',
      JSON.stringify({ ...emptyState(), ...parsed, cards }),
    )
  }
  state = loadFor(mode)
  for (const l of listeners) l(state)
}

export function reset() {
  // 只清空当前 mode 的数据, 另一个 mode 不动
  state = emptyState()
  try {
    localStorage.setItem(KEY_PREFIX + mode + '.v1', JSON.stringify(state))
  } catch {}
  for (const l of listeners) l(state)
}
