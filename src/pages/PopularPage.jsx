import { useSets, useCollection } from '../hooks.js'
import { POPULAR_SETS } from '../lib/popular.js'
import { ownedInSet } from '../lib/stats.js'
import PopularSetCard from '../components/PopularSetCard.jsx'
import { useT } from '../lib/i18n.js'

export default function PopularPage() {
  const t = useT()
  const sets = useSets()
  const col = useCollection()

  if (!sets) return <div className="py-20 text-center text-slate-400">{t('era.loading')}</div>

  const popular = POPULAR_SETS.map((id) => sets.find((s) => s.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('home.popular')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {popular.map((s) => (
          <PopularSetCard key={s.id} set={s} owned={ownedInSet(col.cards, s.id)} fluid />
        ))}
      </div>
    </div>
  )
}
