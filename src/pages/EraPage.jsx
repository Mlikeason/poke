import { useParams } from 'react-router-dom'
import { useSets, useCollection } from '../hooks.js'
import { eraById, eraForSeries } from '../lib/eras.js'
import { ownedInSet } from '../lib/stats.js'
import SetCard from '../components/SetCard.jsx'
import { useT, useLocale, eraDisplay } from '../lib/i18n.js'

export default function EraPage() {
  const t = useT()
  const locale = useLocale()
  const { eraId } = useParams()
  const sets = useSets()
  const col = useCollection()
  const era = eraById(eraId)

  if (!era) return <div className="py-20 text-center text-slate-400">{t('era.notFound')}</div>
  if (!sets) return <div className="py-20 text-center text-slate-400">{t('era.loading')}</div>

  const mine = sets
    .filter((s) => eraForSeries(s.series) === eraId)
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))

  const gradient = `linear-gradient(135deg, ${era.accent.from}, ${era.accent.to})`
  const { primary, secondary } = eraDisplay(era, locale)

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden rounded-3xl p-6 shadow-md"
        style={{ background: gradient, color: era.accent.text }}
      >
        <div className="text-xs opacity-80">{era.years}</div>
        <h1 className="text-3xl font-medium leading-tight">{primary}</h1>
        <div className="mt-1 text-sm opacity-90">
          {secondary ? `${secondary} · ` : ''}{t('era.sets', { n: mine.length })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {mine.map((s) => (
          <SetCard key={s.id} set={s} owned={ownedInSet(col.cards, s.id)} gradient={gradient} />
        ))}
      </div>
    </div>
  )
}
