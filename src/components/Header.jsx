import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n.js'
import { useMode } from '../lib/mode.js'
import TabBar from './TabBar.jsx'

export const POKE_RED = '#EE1515'
export const PIKACHU_YELLOW = '#FFCC00'

export default function Header() {
  const t = useT()
  const mode = useMode()

  return (
    <header
      className="sticky top-0 z-30 shadow-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* 第 1 行: 品牌 logo */}
      <div
        className="border-b border-black/10"
        style={{ background: PIKACHU_YELLOW }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
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
            <Link
              to="/settings"
              title={mode === 'jp' ? 'Japanese catalog (tap to change)' : 'English catalog (tap to change)'}
              className="rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white shadow-sm"
            >
              {mode.toUpperCase()}
            </Link>
          </div>

          <div className="flex-1" />

          <Link
            to="/scan"
            title={t('scan.title')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:scale-110 hover:text-slate-900"
          >
            <ScanIcon />
          </Link>

          <Link
            to="/search"
            title="Search"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-slate-700 shadow-sm transition hover:scale-110 hover:text-slate-900"
          >
            <SearchIcon />
          </Link>
        </div>
      </div>

      {/* 第 2 行: 5 个 tab */}
      <TabBar />
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

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  )
}
