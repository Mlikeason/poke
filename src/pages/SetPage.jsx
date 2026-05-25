import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSets, useCollection, useImageManifest } from '../hooks.js'
import { getCardsForSet } from '../lib/api.js'
import { eraForSeries, eraById } from '../lib/eras.js'
import { ownedInSet } from '../lib/stats.js'
import CardTile from '../components/CardTile.jsx'
import PackArt from '../components/PackArt.jsx'
import { setCode } from '../lib/setCode.js'
import { isChase } from '../lib/chase.js'
import { sortByNumber, sortByRarity } from '../lib/sort.js'
import { useT, useLocale, eraDisplay } from '../lib/i18n.js'

export default function SetPage() {
  const t = useT()
  const locale = useLocale()
  const { setId } = useParams()
  const sets = useSets()
  const col = useCollection()
  const manifest = useImageManifest()
  const [cards, setCards] = useState(null)
  const [err, setErr] = useState(null)
  const [filter, setFilter] = useState('owned') // owned (default) | all | wanted
  const [sort, setSort] = useState('number') // number | rarity
  const [query, setQuery] = useState('')
  const [hasPack, setHasPack] = useState(true) // 乐观默认, PackArt 探测后回调

  // 进 wanted tab 时默认按稀有度排, 其他默认按编号. 用户改了之后保持
  useEffect(() => {
    setSort(filter === 'wanted' ? 'rarity' : 'number')
  }, [filter])

  useEffect(() => {
    setCards(null)
    setErr(null)
    let cancel = false
    getCardsForSet(setId)
      .then((c) => !cancel && setCards(c))
      .catch((e) => !cancel && setErr(e.message))
    return () => {
      cancel = true
    }
  }, [setId])

  const set = sets?.find((s) => s.id === setId)
  const era = set ? eraById(eraForSeries(set.series)) : null
  const gradient = era
    ? `linear-gradient(135deg, ${era.accent.from}, ${era.accent.to})`
    : 'linear-gradient(135deg,#94a3b8,#475569)'

  const filtered = useMemo(() => {
    if (!cards) return []
    let arr = cards
    if (filter === 'owned') arr = arr.filter((c) => (col.cards[c.id]?.owned || 0) > 0)
    if (filter === 'wanted') {
      // 默认显示 chase cards + 用户手动标想要, 已拥有的不显示
      arr = arr.filter((c) => {
        const e = col.cards[c.id]
        if ((e?.owned || 0) > 0) return false
        return e?.wanted || isChase(c)
      })
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      arr = arr.filter((c) => c.name.toLowerCase().includes(q) || c.number.includes(q))
    }
    return sort === 'rarity' ? sortByRarity(arr) : sortByNumber(arr)
  }, [cards, col.cards, filter, query, sort])

  const owned = set ? ownedInSet(col.cards, set.id) : 0
  const total = set?.total || cards?.length || 0
  const localImageBase = manifest[setId] ? `${import.meta.env.BASE_URL}cards/${setId}` : null

  const { primary: eraPrimary } = era ? eraDisplay(era, locale) : { primary: '' }

  return (
    <div className="space-y-5">
      {/* Set hero — 白底, logo 横向矩形, 右边可选 pack art */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200">
        <div className="flex items-stretch gap-4 p-5">
          {set?.logo && (
            <div className="grid h-24 w-44 shrink-0 place-items-center rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <img src={set.logo} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {/* 行 1: code + 发布日期 */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">{setCode(setId)}</span>
              <span>{set?.releaseDate}</span>
            </div>
            {/* 行 2: era 名 */}
            <div className="mt-1 text-xs text-slate-500">{eraPrimary}</div>
            {/* 行 3: set name */}
            <h1 className="mt-1 truncate text-2xl font-medium text-slate-900">{set?.name || setId}</h1>
            {/* 行 4: 仅 X/Y · pct% */}
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <span>{owned} / {total}</span>
              <span className="text-slate-300">·</span>
              <span>{total > 0 ? Math.round((owned / total) * 100) : 0}%</span>
            </div>
          </div>
          {/* Pack art (右侧, 仅当 public/packs/<setId>.* 存在时显示) */}
          {hasPack && (
            <div className="hidden h-24 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-100 sm:block">
              <PackArt setId={setId} alt="" className="h-full w-full" hideIfMissing onResolve={setHasPack} />
            </div>
          )}
        </div>
      </div>

      {/* 工具条: tabs 居左, sort 居右, 同高 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-full bg-white/70 p-1 ring-1 ring-slate-200">
          {[
            ['owned', t('tab.owned')],
            ['all', t('tab.all')],
            ['wanted', t('tab.wanted')],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={
                'rounded-full px-3 py-1 text-sm transition ' +
                (filter === k ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900')
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-full bg-white/70 p-1 ring-1 ring-slate-200">
          {[
            ['number', t('sort.number')],
            ['rarity', t('sort.rarity')],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={
                'rounded-full px-3 py-1 text-sm transition ' +
                (sort === k ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 卡片网格 */}
      {err && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          {t('set.loadError', { msg: err })}
        </div>
      )}
      {!cards && !err && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[245/342] animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      )}
      {cards && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/60 p-10 text-center text-sm text-slate-500">{t('set.empty')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((c) => (
                <CardTile
                  key={c.id}
                  card={c}
                  entry={col.cards[c.id]}
                  customPrice={col.customPrices[c.id]}
                  localImageBase={localImageBase}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
