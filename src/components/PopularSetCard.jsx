import { Link } from 'react-router-dom'
import PackArt from './PackArt.jsx'
import { setCode } from '../lib/setCode.js'

const POKE_RED = '#EE1515'

export default function PopularSetCard({ set, owned, fluid }) {
  if (!set) return null
  const pct = set.total > 0 ? Math.round((owned / set.total) * 100) : 0

  return (
    <Link
      to={`/set/${set.id}`}
      className={
        'group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl ' +
        (fluid ? 'w-full' : 'w-full')
      }
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white">
        <PackArt
          setId={set.id}
          logo={set.logo}
          alt={set.name}
          className="h-full w-full transition group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white shadow-sm backdrop-blur">
          {setCode(set.id)}
        </span>
      </div>
      <div className="space-y-1 border-t border-slate-100 p-3">
        <h4 className="truncate text-sm font-medium text-slate-900">{set.name}</h4>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{owned} / {set.total}</span>
          <span className="font-medium text-slate-700">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: POKE_RED }}
          />
        </div>
      </div>
    </Link>
  )
}
