import { useEffect, useState } from 'react'
import { getState, subscribe, mergePrices } from './lib/collection.js'
import { CUSTOM_SETS } from './lib/customSets.js'

// 让组件订阅 collection 变化
export function useCollection() {
  const [s, set] = useState(getState())
  useEffect(() => subscribe(set), [])
  return s
}

// 拉 public/sets.json, 并合并手工自定义 set (日文 set 等)
export function useSets() {
  const [sets, setSets] = useState(null)
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'sets.json')
      .then((r) => r.json())
      .then((api) => {
        const merged = [...CUSTOM_SETS, ...api].sort((a, b) =>
          a.releaseDate < b.releaseDate ? 1 : -1,
        )
        setSets(merged)
      })
      .catch((e) => {
        console.error('sets.json load failed', e)
        setSets([...CUSTOM_SETS])
      })
  }, [])
  return sets
}

// 启动时把 public/prices.json 一次性合并进 collection.prices
// (覆盖所有 set, 无需等用户浏览; 文件由 scripts/fetch-prices.js 生成)
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

// public/cards/manifest.json: { setId: true } - 哪些 set 已经把卡片图下载到本地
export function useImageManifest() {
  const [m, setM] = useState({})
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'cards/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => setM(j || {}))
      .catch(() => setM({}))
  }, [])
  return m
}
