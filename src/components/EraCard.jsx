import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n.js'

export default function EraCard({ era, total, setCount, compact }) {
  const t = useT()
  const gradient = `linear-gradient(135deg, ${era.accent.from}, ${era.accent.to})`

  const padding = compact ? 'p-3' : 'p-4 sm:p-5'
  const titleSize = compact ? 'text-sm' : 'text-base sm:text-lg'
  const yearSize = compact ? 'text-[10px]' : 'text-xs'
  const statSize = compact ? 'text-[11px]' : 'text-xs sm:text-sm'
  const emojiPos = compact ? 'right-1 top-1 text-3xl' : 'right-2 top-2 text-4xl sm:text-5xl'

  return (
    <Link
      to={`/era/${era.id}`}
      className={
        'group relative block overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ' +
        padding
      }
      style={{ background: gradient, color: era.accent.text }}
    >
      <div className={'absolute opacity-30 transition group-hover:scale-110 ' + emojiPos}>
        {era.emoji}
      </div>
      <div className="relative">
        <h3 className={'truncate pr-7 font-medium leading-tight ' + titleSize}>{era.name}</h3>
        <div className={'mt-0.5 opacity-80 ' + yearSize}>{era.years}</div>
        <div className={'mt-2 opacity-95 ' + statSize}>
          <span className="font-medium">{setCount}</span> {t('era.setsWord')}{' '}
          <span className="opacity-60">·</span>{' '}
          <span className="font-medium">{total.toLocaleString()}</span> {t('era.cardsWord')}
        </div>
      </div>
    </Link>
  )
}
