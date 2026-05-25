import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection, useSets } from '../hooks.js'
import { ERAS, groupSetsByEra } from '../lib/eras.js'
import { statsByEra, uniqueOwnedCount, estimatedValue, ownedInSet } from '../lib/stats.js'
import { POPULAR_SETS, POPULAR_HOME_COUNT } from '../lib/popular.js'
import { formatSgd } from '../lib/currency.js'
import EraCard from '../components/EraCard.jsx'
import PopularSetCard from '../components/PopularSetCard.jsx'
import ChevronRight from '../components/ChevronRight.jsx'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'

export default function Home() {
  const t = useT()
  const sets = useSets()
  const col = useCollection()
  const [archiveOpen, setArchiveOpen] = useState(false)

  if (!sets) return <div className="py-20 text-center text-slate-400">{t('home.loading')}</div>

  const grouped = groupSetsByEra(sets)
  const stats = statsByEra(sets, col.cards)
  const recent = ERAS.filter((e) => e.bucket === 'recent')
  const archive = ERAS.filter((e) => e.bucket === 'archive')

  const ownedAll = uniqueOwnedCount(col.cards)
  const valueUsd = estimatedValue(col.cards, col.customPrices, col.prices)

  const popularAll = POPULAR_SETS.map((id) => sets.find((s) => s.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))
  const popularHome = popularAll.slice(0, POPULAR_HOME_COUNT)
  const hasMorePopular = popularAll.length > POPULAR_HOME_COUNT

  return (
    <div className="space-y-10">
      {/* Hero: 卡数 + SGD 价值 + 进入 my-cards 的 chevron */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-medium text-slate-900">{t('home.heroLabel')}</h1>
        <Link
          to="/my-cards"
          title={t('home.viewAll')}
          className="inline-flex h-6 w-6 -translate-y-[1px] items-center justify-center rounded-full text-slate-400 hover:text-slate-900"
        >
          <ChevronRight size={18} />
        </Link>
        <span className="text-sm text-slate-500">
          {ownedAll.toLocaleString()} {t('home.cardsWord')} · {formatSgd(valueUsd)}
        </span>
      </div>

      {popularHome.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
              {t('home.popular')}
            </h2>
            {hasMorePopular && (
              <Link
                to="/popular"
                title={t('home.more')}
                className="grid h-7 w-7 place-items-center rounded-full text-white shadow-sm transition hover:scale-110"
                style={{ background: POKE_RED }}
              >
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {popularHome.map((s) => (
              <PopularSetCard key={s.id} set={s} owned={ownedInSet(col.cards, s.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">{t('home.recent')}</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {recent.map((era) => (
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
      </section>

      <section>
        <button
          onClick={() => setArchiveOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-5 py-3 text-left backdrop-blur transition hover:bg-white/80"
        >
          <span className="text-sm font-medium text-slate-600">
            {t('home.archive', { n: archive.length })}
          </span>
          <ChevronRight
            size={16}
            className={
              'text-slate-400 transition-transform ' + (archiveOpen ? 'rotate-90' : '')
            }
          />
        </button>

        {archiveOpen && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {archive.map((era) => (
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
        )}
      </section>
    </div>
  )
}
