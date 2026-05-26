import { useEffect, useState } from 'react'
import { getState, subscribe, mergePrices } from './lib/collection.js'
import { useMode } from './lib/mode.js'
import { JP_SETS } from './lib/customSets.js'

// collection state (mode 切换时自动 reload)
export function useCollection() {
  const [s, set] = useState(getState())
  useEffect(() => subscribe(set), [])
  return s
}

// 根据当前 mode 返回 sets:
//   EN mode: 拉 public/sets.json (173 个)
//   JP mode: 用 JP_SETS (手工维护, 目前只有 M1L)
export function useSets() {
  const mode = useMode()
  const [enSets, setEnSets] = useState(null)

  useEffect(() => {
    if (enSets) return
    fetch(import.meta.env.BASE_URL + 'sets.json')
      .then((r) => r.json())
      .then(setEnSets)
      .catch((e) => {
        console.error('sets.json load failed', e)
        setEnSets([])
      })
  }, [enSets])

  if (mode === 'jp') {
    return [...JP_SETS].sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))
  }
  return enSets
}

// 启动一次性把 public/prices.json (EN 全量价格) 灌进 EN collection.
// JP mode 暂时没有价格数据.
let bootPricesLoaded = false
export function useBootPrices() {
  useEffect(() => {
    if (bootPricesLoaded) return
    bootPricesLoaded = true
    fetch(import.meta.env.BASE_URL + 'prices.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') mergePrices(data)
      })
      .catch(() => {})
  }, [])
}

// public/cards/manifest.json (EN) 或 public/cards/jp/manifest.json (JP)
export function useImageManifest() {
  const mode = useMode()
  const [m, setM] = useState({})
  useEffect(() => {
    const path = mode === 'jp' ? 'cards/jp/manifest.json' : 'cards/manifest.json'
    fetch(import.meta.env.BASE_URL + path)
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => setM(j || {}))
      .catch(() => setM({}))
  }, [mode])
  return m
}
