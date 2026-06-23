import { useParams } from 'react-router-dom'
import { useSets, useCollection } from '../hooks.js'
import { eraById, eraForSeries } from '../lib/eras.js'
import { ownedInSet } from '../lib/stats.js'
import SetCard from '../components/SetCard.jsx'
import { useT } from '../lib/i18n.js'

export default function EraPage() {
  const t = useT()
  const { eraId } = useParams()
  const sets = useSets()
  const col = useCollection()
  const era = eraById(eraId)

  if (!era) return <div className="py-20 text-center text-slate-400">{t('era.notFound')}</div>
  if (!sets) return <div className="py-20 text-center text-slate-400">{t('era.loading')}</div>

  const mine = sets
    .filter((s) => eraForSeries(s.series) === eraId)
    .map((s) => ({ set: s, owned: ownedInSet(col.cards, s.id) }))
    .sort((a, b) => {
      // 拥有数量降序; 同数量按发行日期降序 (新的在前)
      if (b.owned !== a.owned) return b.owned - a.owned
      return a.set.releaseDate < b.set.releaseDate ? 1 : -1
    })

  const gradient = `linear-gradient(135deg, ${era.accent.from}, ${era.accent.to})`

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden rounded-3xl p-6 shadow-md"
        style={{ background: gradient, color: era.accent.text }}
      >
        <div className="text-xs opacity-80">{era.years}</div>
        <h1 className="text-3xl font-medium leading-tight">{era.name}</h1>
        <div className="mt-1 text-sm opacity-90">{t('era.sets', { n: mine.length })}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {mine.map(({ set: s, owned }) => (
          <SetCard key={s.id} set={s} owned={owned} gradient={gradient} />
        ))}
      </div>
    </div>
  )
}
