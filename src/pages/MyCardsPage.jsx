import { useEffect, useMemo, useState } from 'react'
import { useCollection } from '../hooks.js'
import { getCardsForSet } from '../lib/api.js'
import { priceFor } from '../lib/collection.js'
import CardTile from '../components/CardTile.jsx'
import SharePoster from '../components/SharePoster.jsx'
import { useT } from '../lib/i18n.js'

function setIdOf(cardId) {
  const i = cardId.lastIndexOf('-')
  return i < 0 ? cardId : cardId.substring(0, i)
}

const POKE_RED = '#EE1515'

export default function MyCardsPage() {
  const t = useT()
  const col = useCollection()
  const [bySet, setBySet] = useState({}) // setId -> cards[]
  const [loading, setLoading] = useState(false)
  const [posterOpen, setPosterOpen] = useState(false)

  // 用户拥有的所有 card id, 按所属 set 去重
  const ownedIds = Object.entries(col.cards)
    .filter(([_, v]) => (v.owned || 0) > 0)
    .map(([id]) => id)
  const neededSetIds = useMemo(
    () => Array.from(new Set(ownedIds.map(setIdOf))),
    [ownedIds.join('|')],
  )

  useEffect(() => {
    let cancel = false
    const missing = neededSetIds.filter((sid) => !bySet[sid])
    if (missing.length === 0) return
    setLoading(true)
    Promise.all(
      missing.map((sid) => getCardsForSet(sid).then((cards) => [sid, cards]).catch(() => [sid, []])),
    ).then((entries) => {
      if (cancel) return
      setBySet((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      setLoading(false)
    })
    return () => {
      cancel = true
    }
  }, [neededSetIds.join('|')])

  // 把 ownedIds 映射到具体 card 对象, 按价值降序排 (贵的在前)
  const cards = useMemo(() => {
    const flat = []
    for (const id of ownedIds) {
      const sid = setIdOf(id)
      const c = bySet[sid]?.find((x) => x.id === id)
      if (c) flat.push(c)
    }
    return flat.sort((a, b) => {
      const pa = priceFor(a.id) ?? 0
      const pb = priceFor(b.id) ?? 0
      if (pb !== pa) return pb - pa
      // 同价按 rarity 兜底 (避免不稳定)
      return (a.rarity || '').localeCompare(b.rarity || '')
    })
  }, [ownedIds.join('|'), bySet])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-slate-900">{t('mycards.title')}</h1>
        {ownedIds.length > 0 && (
          <button
            onClick={() => setPosterOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow transition hover:brightness-105"
            style={{ background: POKE_RED }}
          >
            <ShareIcon />
            {t('mycards.sharePoster')}
          </button>
        )}
      </div>

      {ownedIds.length === 0 ? (
        <div className="rounded-2xl bg-white/60 p-10 text-center text-sm text-slate-500">{t('mycards.empty')}</div>
      ) : loading && cards.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[245/342] animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((c) => (
            <CardTile
              key={c.id}
              card={c}
              entry={col.cards[c.id]}
              customPrice={col.customPrices[c.id]}
              showSet
              readonly
            />
          ))}
        </div>
      )}

      <SharePoster open={posterOpen} onClose={() => setPosterOpen(false)} />
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}
