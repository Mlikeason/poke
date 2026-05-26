// 全局 catalog mode: 'en' (English Pokemon cards) | 'jp' (Japanese)
// 切换 mode → 不同的 sets 数据 + 不同的 collection 数据库
import { useEffect, useState } from 'react'

const KEY = 'poke.mode'

let current = (() => {
  try {
    return localStorage.getItem(KEY) || 'en'
  } catch {
    return 'en'
  }
})()
const listeners = new Set()

export function getMode() {
  return current
}

export function setMode(m) {
  if (m !== 'en' && m !== 'jp') return
  if (m === current) return
  current = m
  try {
    localStorage.setItem(KEY, m)
  } catch {}
  for (const fn of listeners) fn(m)
}

export function useMode() {
  const [m, set] = useState(current)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return m
}

export function onModeChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
