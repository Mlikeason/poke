import { useSets, useCollection } from '../hooks.js'
import { ERAS, groupSetsByEra } from '../lib/eras.js'
import { statsByEra } from '../lib/stats.js'
import EraCard from '../components/EraCard.jsx'
import { useT } from '../lib/i18n.js'

export default function ErasPage() {
  const t = useT()
  const sets = useSets()
  const col = useCollection()

  if (!sets) return <div className="py-20 text-center text-slate-400">{t('home.loading')}</div>

  const grouped = groupSetsByEra(sets)
  const stats = statsByEra(sets, col.cards)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('eras.title')}</h1>
      {/* 全部 13 个 era 一律 compact 排成 3 列 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {ERAS.map((era) => (
          <EraCard
            key={era.id}
            era={era}
            owned={stats[era.id]?.owned || 0}
            total={stats[era.id]?.total || 0}
            setCount={(grouped.get(era.id) || []).length}
            compact
          />
        ))}
      </div>
    </div>
  )
}
