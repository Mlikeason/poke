import { Link } from 'react-router-dom'
import PackArt from './PackArt.jsx'
import { setCode } from '../lib/setCode.js'

export default function PopularSetCard({ set, owned }) {
  if (!set) return null

  return (
    <Link
      to={`/set/${set.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <PackArt
          setId={set.id}
          logo={set.logo}
          alt={set.name}
          className="h-full w-full transition group-hover:scale-[1.03]"
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white shadow-sm backdrop-blur">
          {setCode(set.id)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <h4 className="min-w-0 truncate text-sm font-medium text-slate-900">{set.name}</h4>
        <span className="shrink-0 font-mono text-xs text-slate-500">
          {owned}/{set.total}
        </span>
      </div>
    </Link>
  )
}
