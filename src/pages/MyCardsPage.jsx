import { useEffect, useMemo, useState } from 'react'
import { useCollection } from '../hooks.js'
import { getCardsForSet } from '../lib/api.js'
import { sortByRarity } from '../lib/sort.js'
import CardTile from '../components/CardTile.jsx'
import { useT } from '../lib/i18n.js'

function setIdOf(cardId) {
  const i = cardId.lastIndexOf('-')
  return i < 0 ? cardId : cardId.substring(0, i)
}

export default function MyCardsPage() {
  const t = useT()
  const col = useCollection()
  const [bySet, setBySet] = useState({}) // setId -> cards[]
  const [loading, setLoading] = useState(false)

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

  // 把 ownedIds 映射到具体 card 对象, 按稀有度排
  const cards = useMemo(() => {
    const flat = []
    for (const id of ownedIds) {
      const sid = setIdOf(id)
      const c = bySet[sid]?.find((x) => x.id === id)
      if (c) flat.push(c)
    }
    return sortByRarity(flat)
  }, [ownedIds.join('|'), bySet])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('mycards.title')}</h1>

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
    </div>
  )
}
