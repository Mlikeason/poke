import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useT } from '../lib/i18n.js'
import SearchBox from './SearchBox.jsx'

export const POKE_RED = '#EE1515'
export const PIKACHU_YELLOW = '#FFCC00'

export default function Header() {
  const t = useT()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header
      className="sticky top-0 z-30 border-b border-black/10"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: PIKACHU_YELLOW,
      }}
    >
      {/* 固定高度的单行布局 */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Pokeball />
          <span
            className="text-xl tracking-wide text-white"
            style={{
              fontFamily: '"Lilita One", system-ui, sans-serif',
              textShadow: '0 1px 0 rgba(0,0,0,0.15)',
              WebkitTextStroke: '0.5px rgba(0,0,0,0.25)',
            }}
          >
            {t('app.title')}
          </span>
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:scale-110 hover:text-slate-900"
          >
            <SearchIcon />
          </button>
        )}
      </div>
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
