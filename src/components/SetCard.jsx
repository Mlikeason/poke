import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar.jsx'
import { setCode } from '../lib/setCode.js'

export default function SetCard({ set, owned, gradient }) {
  const pct = set.total > 0 ? Math.round((owned / set.total) * 100) : 0
  const code = setCode(set.id)
  return (
    <Link
      to={`/set/${set.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="grid h-14 w-28 shrink-0 place-items-center rounded-xl border border-slate-100 bg-white p-1.5">
        {set.logo ? (
          <img src={set.logo} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-300">{code}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate text-base font-medium text-slate-900">{set.name}</h4>
          <span className="shrink-0 text-xs text-slate-400">{set.releaseDate}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium text-white" style={{ background: '#EE1515' }}>{code}</span>
          {set.ptcgoCode && set.ptcgoCode.toUpperCase() !== code && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">{set.ptcgoCode}</span>
          )}
          <span>{owned} / {set.total}</span>
          <span className="font-medium text-slate-700">{pct}%</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={owned} max={set.total} gradient={gradient} />
        </div>
      </div>
    </Link>
  )
}
