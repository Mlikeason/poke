import { Link } from 'react-router-dom'
import { useCollection, useSets } from '../hooks.js'
import { ERAS, groupSetsByEra } from '../lib/eras.js'
import { statsByEra, uniqueOwnedCount, estimatedValue, ownedInSet, totalCardsInSets, wantedCount } from '../lib/stats.js'
import { HOME_POPULAR, POPULAR_SETS } from '../lib/popular.js'
import { JP_HOME_POPULAR, JP_POPULAR_SETS } from '../lib/customSets.js'
import { useMode } from '../lib/mode.js'
import { formatPrice } from '../lib/currency.js'
import EraCard from '../components/EraCard.jsx'
import PopularSetCard from '../components/PopularSetCard.jsx'
import ChevronRight from '../components/ChevronRight.jsx'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'
const PIKACHU_YELLOW = '#FFCC00'

export default function Home() {
  const t = useT()
  const sets = useSets()
  const col = useCollection()
  const mode = useMode()

  if (!sets) return <div className="py-20 text-center text-slate-400">{t('home.loading')}</div>

  const grouped = groupSetsByEra(sets)
  const stats = statsByEra(sets, col.cards)
  const recent = ERAS.filter((e) => e.bucket === 'recent')

  const ownedAll = uniqueOwnedCount(col.cards)
  const totalAll = totalCardsInSets(sets)
  const valueUsd = estimatedValue(col.cards, col.customPrices, col.prices)
  const wanted = wantedCount(col.cards)
  const pct = totalAll > 0 ? (ownedAll / totalAll) * 100 : 0

  // mode 决定用哪一套 popular 列表
  const homeList = mode === 'jp' ? JP_HOME_POPULAR : HOME_POPULAR
  const popularList = mode === 'jp' ? JP_POPULAR_SETS : POPULAR_SETS
  const popularHome = homeList.map((id) => sets.find((s) => s.id === id)).filter(Boolean)
  const hasMorePopular = popularList.length > homeList.length

  return (
    <div className="space-y-8">
      <MyCollectionCard
        t={t}
        owned={ownedAll}
        valueUsd={valueUsd}
        wanted={wanted}
      />

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
              total={stats[era.id]?.total || 0}
              setCount={(grouped.get(era.id) || []).length}
              compact
            />
          ))}
        </div>
      </section>

    </div>
  )
}

function MyCollectionCard({ t, owned, valueUsd, wanted }) {
  return (
    <Link
      to="/my-cards"
      className="group relative block overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200 transition hover:shadow-lg"
    >
      {/* 顶部黄色 + 红色双条 — Pokemon 品牌点缀 */}
      <div className="flex h-1.5 w-full">
        <span className="w-2/3" style={{ background: PIKACHU_YELLOW }} />
        <span className="w-1/3" style={{ background: POKE_RED }} />
      </div>

      <div className="relative p-5 sm:p-6">
        {/* 角落淡 pokeball 水印 */}
        <svg
          className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 opacity-[0.06]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <circle cx="50" cy="50" r="46" />
          <path d="M4 50h92" stroke="white" strokeWidth="6" />
          <circle cx="50" cy="50" r="14" fill="white" />
          <circle cx="50" cy="50" r="7" fill="currentColor" />
        </svg>

        <div className="relative flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {t('home.myCollection')}
          </span>
          <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
        </div>

        {/* 3 等分: 已有 / 价值 / 想要 */}
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          <Stat label={t('home.cardsWord')} value={owned.toLocaleString()} />
          <Stat label={t('home.stat.value')} value={formatPrice(valueUsd)} />
          <Stat label={t('home.stat.wanted')} value={wanted.toLocaleString()} />
        </div>
      </div>
    </Link>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="truncate text-3xl font-medium leading-tight text-slate-900 sm:text-4xl">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}
