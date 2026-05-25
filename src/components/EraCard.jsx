import { Link } from 'react-router-dom'
import { useT, useLocale, eraDisplay } from '../lib/i18n.js'

export default function EraCard({ era, owned, total, setCount, compact }) {
  const t = useT()
  const locale = useLocale()
  const { primary } = eraDisplay(era, locale)
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0
  const gradient = `linear-gradient(135deg, ${era.accent.from}, ${era.accent.to})`

  if (compact) {
    // 紧凑版: 首页一行 3 列
    return (
      <Link
        to={`/era/${era.id}`}
        className="group relative block overflow-hidden rounded-2xl p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        style={{ background: gradient, color: era.accent.text }}
      >
        <div className="absolute right-1 top-1 text-3xl opacity-30 transition group-hover:scale-110">
          {era.emoji}
        </div>
        <div className="relative">
          <h3 className="truncate pr-7 text-sm font-medium leading-tight">{primary}</h3>
          <div className="mt-0.5 text-[10px] opacity-80">{era.years}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-base font-medium leading-none">{pct}%</span>
            <span className="text-[10px] opacity-80">· {setCount}</span>
          </div>
        </div>
      </Link>
    )
  }

  // 全尺寸 (复古档案展开时用)
  return (
    <Link
      to={`/era/${era.id}`}
      className="group relative block overflow-hidden rounded-3xl p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
      style={{ background: gradient, color: era.accent.text }}
    >
      <div className="absolute -right-6 -top-6 text-7xl opacity-25 transition group-hover:scale-110">
        {era.emoji}
      </div>
      <div className="relative">
        <div className="text-xs opacity-80">{era.years}</div>
        <h3 className="text-xl font-medium leading-tight">{primary}</h3>
        <div className="mt-1 text-xs opacity-80">{t('era.sets', { n: setCount })}</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/40">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#fff,rgba(255,255,255,.6))' }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium leading-none">{pct}%</div>
            <div className="text-[10px] opacity-80">{owned.toLocaleString()} / {total.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
