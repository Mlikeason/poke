import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '../lib/i18n.js'
import SearchBox from './SearchBox.jsx'

// Pokemon 品牌红, 也用于 set code badge 等点缀
export const POKE_RED = '#EE1515'

export default function Header() {
  const t = useT()
  const loc = useLocation()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-base font-medium text-slate-900">
          <Pokeball />
          <span className="font-medium tracking-tight">{t('app.title')}</span>
        </Link>

        <div className="flex-1" />

        {showSearch ? (
          <div className="w-[200px]">
            <SearchBox autoFocus onClose={() => setShowSearch(false)} />
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            title="Search"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:scale-110 hover:text-slate-900"
          >
            <SearchIcon />
          </button>
        )}

        <Link
          to="/settings"
          title={t('nav.settings')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:scale-110 hover:text-slate-900"
        >
          <GearIcon />
        </Link>
      </div>

      {loc.pathname !== '/' && (
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-900">{t('nav.back')}</Link>
        </div>
      )}
    </header>
  )
}

function Pokeball() {
  return (
    <span
      className="grid h-8 w-8 place-items-center rounded-full shadow-md"
      style={{ background: POKE_RED }}
    >
      <span className="block h-3.5 w-3.5 rounded-full border-[2.5px] border-black bg-white" />
    </span>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
