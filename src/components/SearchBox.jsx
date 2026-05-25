import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSets } from '../hooks.js'
import { setCode } from '../lib/setCode.js'
import { useT } from '../lib/i18n.js'

export default function SearchBox({ autoFocus, onClose }) {
  const t = useT()
  const sets = useSets()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
      // 不立刻 open 下拉, 等用户敲字
    }
  }, [autoFocus])

  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false)
        // 空且失焦时, 收起 (回到 magnifier 模式)
        if (!q && onClose) onClose()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [q, onClose])

  const matches = useMemo(() => {
    if (!sets || !q.trim()) return []
    const qq = q.trim().toLowerCase()
    return sets
      .map((s) => {
        const code = setCode(s.id).toLowerCase()
        const name = s.name.toLowerCase()
        const ptcgo = (s.ptcgoCode || '').toLowerCase()
        let score = 0
        if (code === qq || ptcgo === qq) score = 100
        else if (code.startsWith(qq) || ptcgo.startsWith(qq)) score = 80
        else if (name.startsWith(qq)) score = 60
        else if (code.includes(qq) || ptcgo.includes(qq)) score = 40
        else if (name.includes(qq)) score = 20
        return { set: s, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (a.set.releaseDate < b.set.releaseDate ? 1 : -1))
      .slice(0, 8)
      .map((x) => x.set)
  }, [sets, q])

  const go = (id) => {
    setOpen(false)
    setQ('')
    onClose?.()
    navigate(`/set/${id}`)
  }

  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const pick = matches[hi] || matches[0]
      if (pick) go(pick.id)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((i) => Math.min(matches.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((i) => Math.max(0, i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQ('')
      onClose?.()
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm focus-within:border-slate-400">
        <SearchIcon />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setHi(0)
            setOpen(true)
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKey}
          placeholder={t('search.setsPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
        />
        {q ? (
          <button
            onClick={() => {
              setQ('')
              setHi(0)
              inputRef.current?.focus()
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        ) : onClose ? (
          <button
            onClick={() => onClose()}
            title="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        ) : null}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">{t('search.noResults')}</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {matches.map((s, i) => (
                <li key={s.id}>
                  <button
                    onMouseEnter={() => setHi(i)}
                    onClick={() => go(s.id)}
                    className={
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition ' +
                      (i === hi ? 'bg-slate-100' : '')
                    }
                  >
                    <div className="grid h-8 w-14 shrink-0 place-items-center rounded-md bg-slate-50 p-1">
                      {s.logo && (
                        <img src={s.logo} alt="" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-900">{s.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="rounded bg-slate-900 px-1 py-0.5 font-mono text-white">{setCode(s.id)}</span>
                        <span>{s.releaseDate}</span>
                        <span>{s.series}</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
