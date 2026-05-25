// 轻量 i18n: 默认英文, 中文可切, 选择存 localStorage
import { useEffect, useState } from 'react'

const KEY = 'poke.locale'

let current = (() => {
  try {
    return localStorage.getItem(KEY) || 'en'
  } catch {
    return 'en'
  }
})()
const listeners = new Set()

const M = {
  en: {
    'app.title': 'My Pokemon Cards',
    'nav.back': '← Back',
    'nav.settings': 'Settings',
    'tab.eras': 'Eras',
    'tab.sets': 'Sets',
    'tab.my': 'My Cards',
    'tab.settings': 'Settings',
    'home.myCollection': 'My Collection',
    'home.stat.value': 'value',
    'home.stat.wanted': 'wanted',
    'home.stat.complete': 'complete',
    'footer': 'Data from pokemontcg.io · Collection saved in your browser',

    'header.owned': 'Owned',
    'header.wanted': 'Wanted',
    'header.value': 'Value',
    'header.copies': '{n} copies',

    'home.recent': 'Recent Eras',
    'home.archive': 'Vintage Archive · {n} eras (1999–2019)',
    'home.expand': 'Show ▾',
    'home.collapse': 'Hide ▴',
    'home.heroLabel': 'My Card Album',
    'home.heroProgress': '{pct}% complete · {dup} extras',
    'home.viewAll': 'View all my cards →',
    'home.cardsWord': 'cards',
    'home.loading': 'Loading eras…',
    'home.cards': 'cards',

    'era.notFound': 'Era not found',
    'era.loading': 'Loading…',
    'era.sets': '{n} sets',

    'set.empty': 'No matching cards',
    'set.loadError': 'Load failed: {msg}',
    'set.complete': '{pct}% collected',
    'set.cards': '{owned} / {total} cards',

    'tab.owned': 'Owned',
    'tab.all': 'All',
    'tab.wanted': 'Wanted',

    'sort.label': 'Sort',
    'sort.number': 'Number',
    'sort.rarity': 'Rarity',

    'search.placeholder': 'Search name or number…',
    'search.setsPlaceholder': 'Search sets (e.g. M4, 151, Paldean…)',
    'search.noResults': 'No matches',

    'home.popular': 'Popular Sets',
    'home.more': 'More →',
    'home.chaseHint': 'Chase cards you don\'t own yet',

    'mycards.title': 'All My Cards',
    'mycards.empty': 'No cards yet — open a set and tap + on a card.',

    'card.market': 'market',
    'card.addPrice': '+ price',
    'card.priceTitleCustom': 'Custom price (click to edit)',
    'card.priceTitleMarket': 'Market price (click to override)',
    'card.priceTitleEmpty': 'Click to add a price',
    'card.zoomHint': 'Click to enlarge',

    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.data': 'Collection data',
    'settings.export': 'Export as JSON',
    'settings.exportDesc': 'Save your collection to a JSON file. Useful for backup or moving to another device.',
    'settings.import': 'Import from JSON',
    'settings.importDesc': 'Replace your current collection with a JSON file you exported before.',
    'settings.danger': 'Danger zone',
    'settings.reset': 'Clear everything',
    'settings.resetDesc': 'Erases all owned/wanted marks, custom prices, and cached card data. Cannot be undone.',
    'settings.resetConfirm': 'Erase ALL collection data? This cannot be undone.',
    'settings.imported': 'Import succeeded.',
    'settings.importFailed': 'Import failed: {msg}',
    'settings.images': 'Card images',
    'settings.imagesHelp': 'Card images load from pokemontcg.io. To save them locally so you do not depend on that service, run in your terminal:',
    'settings.imagesHelpAll': 'Or download all 173 sets in one go (large, takes a while):',
    'settings.packs': 'Pack wrapper images',
    'settings.packsHelp': 'To show a booster pack image alongside the set logo, drop a JPG/PNG/WEBP file into public/packs/ named after the set id, e.g. public/packs/sv8.jpg for Surging Sparks. The app picks it up automatically — no manifest needed.',
  },
  zh: {
    'app.title': 'My Pokemon Cards',
    'nav.back': '← 返回',
    'nav.settings': '设置',
    'tab.eras': '世代',
    'tab.sets': '系列',
    'tab.my': '我的卡',
    'tab.settings': '设置',
    'home.myCollection': '我的收藏',
    'home.stat.value': '总价值',
    'home.stat.wanted': '想要',
    'home.stat.complete': '完成度',
    'footer': '数据来自 pokemontcg.io · 收藏存在浏览器本地',

    'header.owned': '拥有',
    'header.wanted': '想要',
    'header.value': '估价',
    'header.copies': '共 {n} 张',

    'home.recent': '最新世代',
    'home.archive': '复古档案 · {n} 个世代 (1999–2019)',
    'home.expand': '展开 ▾',
    'home.collapse': '收起 ▴',
    'home.heroLabel': '我的卡册',
    'home.heroProgress': '收集进度 {pct}% · 重复 {dup} 张',
    'home.viewAll': '查看所有卡片 →',
    'home.cardsWord': '张',
    'home.loading': '正在加载世代…',
    'home.cards': '张',

    'era.notFound': '找不到世代',
    'era.loading': '加载中…',
    'era.sets': '{n} 个系列',

    'set.empty': '没匹配的卡',
    'set.loadError': '加载失败: {msg}',
    'set.complete': '{pct}% 已收集',
    'set.cards': '{owned} / {total} 张',

    'tab.owned': '已有',
    'tab.all': '全部',
    'tab.wanted': '想要',

    'sort.label': '排序',
    'sort.number': '编号',
    'sort.rarity': '稀有度',

    'search.placeholder': '按名字或编号搜索…',
    'search.setsPlaceholder': '搜索系列 (如 M4、151、朱紫…)',
    'search.noResults': '没找到',

    'home.popular': '流行系列',
    'home.more': '更多 →',
    'home.chaseHint': '你还没拥有的重点收藏卡',

    'mycards.title': '我的全部卡片',
    'mycards.empty': '还没有卡 — 进任一系列, 在卡片上点 + 标记拥有。',

    'card.market': '市场',
    'card.addPrice': '+ 标价',
    'card.priceTitleCustom': '手动价 (点击修改)',
    'card.priceTitleMarket': '市场价 (点击覆盖)',
    'card.priceTitleEmpty': '点击添加价格',
    'card.zoomHint': '点击放大',

    'settings.title': '设置',
    'settings.language': '语言',
    'settings.data': '收藏数据',
    'settings.export': '导出为 JSON',
    'settings.exportDesc': '把收藏数据导出成 JSON 文件,方便备份或换设备。',
    'settings.import': '从 JSON 导入',
    'settings.importDesc': '用之前导出的 JSON 替换当前收藏。',
    'settings.danger': '危险操作',
    'settings.reset': '清空全部',
    'settings.resetDesc': '清除所有拥有/想要标记、手动价格、卡片缓存。不可撤销。',
    'settings.resetConfirm': '清空所有收藏数据? 这操作不可撤销。',
    'settings.imported': '导入成功',
    'settings.importFailed': '导入失败: {msg}',
    'settings.images': '卡片图片',
    'settings.imagesHelp': '卡片图默认从 pokemontcg.io 加载。如果想保存到本地不依赖外网,在终端里运行:',
    'settings.imagesHelpAll': '或者一次性下载全部 173 个系列 (体积大, 较慢):',
    'settings.packs': '卡包包装图',
    'settings.packsHelp': '想在系列旁边展示真实的卡包外包装图: 把 JPG/PNG/WEBP 文件放到 public/packs/ 里, 文件名用 set id, 例如 public/packs/sv8.jpg 对应 Surging Sparks。App 会自动识别, 不需要 manifest。',
  },
}

export function getLocale() {
  return current
}

export function setLocale(l) {
  if (l === current) return
  current = l
  try {
    localStorage.setItem(KEY, l)
  } catch {}
  for (const fn of listeners) fn(l)
}

export function useLocale() {
  const [l, set] = useState(current)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return l
}

export function useT() {
  const l = useLocale()
  return (key, vars) => {
    let s = M[l]?.[key] ?? M.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    }
    return s
  }
}

// 世代名: 中文模式下优先用 nameCn, 英文用 name
export function eraDisplay(era, locale) {
  if (locale === 'zh') {
    return { primary: era.nameCn || era.name, secondary: era.name }
  }
  return { primary: era.name, secondary: null }
}
