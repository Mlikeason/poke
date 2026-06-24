import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSets } from '../hooks.js'
import { searchAll } from '../lib/globalSearch.js'
import { setCode } from '../lib/setCode.js'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'
const PIKACHU_YELLOW = '#FFCC00'

export default function SearchPage() {
  const t = useT()
  const sets = useSets()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q), 150)
    return () => window.clearTimeout(id)
  }, [q])

  const results = useMemo(() => {
    if (!sets) return { sets: [], cards: [] }
    return searchAll(debounced, sets)
  }, [debounced, sets])

  const isEmpty = debounced.trim().length > 0 && results.sets.length === 0 && results.cards.length === 0

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('search.title')}</h1>

      <div className="sticky top-[calc(env(safe-area-inset-top)+7rem)] z-10 -mx-4 px-4 py-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-slate-400">
          <SearchIcon />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.allPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
          />
          {q && (
            <button
              onClick={() => { setQ(''); inputRef.current?.focus() }}
              className="text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!debounced.trim() && (
        <p className="rounded-2xl bg-white/60 p-4 text-sm text-slate-500">{t('search.cardHelp')}</p>
      )}

      {isEmpty && (
        <div className="rounded-2xl bg-white/60 p-8 text-center text-sm text-slate-500">
          {t('search.noResultsQuery', { q: debounced.trim() })}
        </div>
      )}

      {results.sets.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            {t('search.setsSection')} · {results.sets.length}
          </h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {results.sets.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/set/${s.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <div className="grid h-9 w-16 shrink-0 place-items-center rounded-md bg-slate-50 p-1 ring-1 ring-slate-100">
                    {s.logo && <img src={s.logo} alt="" className="max-h-full max-w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{s.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="rounded bg-slate-900 px-1 py-0.5 font-mono text-white">{setCode(s.id)}</span>
                      <span>{s.releaseDate}</span>
                      {s.series && <span>{s.series}</span>}
                    </div>
                  </div>
                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.cards.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            {t('search.cardsSection')} · {results.cards.length}
          </h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {results.cards.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/card/${c.id}`}
                  className="flex items-center gap-3 px-3 py-2 transition hover:bg-slate-50"
                >
                  <div className="grid h-12 w-9 shrink-0 place-items-center overflow-hidden rounded bg-slate-100">
                    {c.img ? (
                      <img src={c.img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-[9px] text-slate-400">#{c.number}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>#{c.number}</span>
                      {c.rarity && <span>· {c.rarity}</span>}
                    </div>
                  </div>
                  <span
                    className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium text-white"
                    style={{ background: POKE_RED }}
                  >
                    {setCode(c.setId)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {results.cards.length >= 50 && (
            <p className="mt-2 text-xs text-slate-400">Showing first 50 matches.</p>
          )}
        </section>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
