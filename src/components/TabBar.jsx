import { Link, useLocation } from 'react-router-dom'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'

// 判断 tab 当前激活: 严格首页 / 各页面前缀
function isActive(loc, path) {
  if (path === '/') return loc === '/'
  return loc === path || loc.startsWith(path + '/')
}

export default function TabBar() {
  const t = useT()
  const { pathname } = useLocation()

  const tabs = [
    { path: '/', label: t('tab.eras'), icon: ErasIcon },
    { path: '/popular', label: t('tab.sets'), icon: SetsIcon },
    { path: '/my-cards', label: t('tab.my'), icon: MyIcon },
    { path: '/settings', label: t('tab.settings'), icon: SettingsIcon },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        background: POKE_RED,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="mx-auto flex max-w-6xl items-stretch">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.path)
          const Icon = tab.icon
          return (
            <li key={tab.path} className="flex-1">
              <Link
                to={tab.path}
                className={
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 transition ' +
                  (active ? 'text-white' : 'text-white/65 hover:text-white')
                }
              >
                <Icon active={active} />
                <span className={'text-[10px] leading-tight ' + (active ? 'font-medium' : '')}>
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function svg(active, paths) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? '1.5' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  )
}

function ErasIcon({ active }) {
  // 堆叠的层 (代表世代)
  return svg(
    active,
    <>
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="m2 17 10 5 10-5" fill="none" />
      <path d="m2 12 10 5 10-5" fill="none" />
    </>,
  )
}

function SetsIcon({ active }) {
  // 网格 (代表系列集合)
  return svg(
    active,
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
  )
}

function MyIcon({ active }) {
  // 卡片图标
  return svg(
    active,
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18" fill="none" />
    </>,
  )
}

function SettingsIcon({ active }) {
  return svg(
    active,
    <>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        fill="none"
      />
    </>,
  )
}
