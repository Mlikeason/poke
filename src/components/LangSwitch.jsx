import { useLocale, setLocale } from '../lib/i18n.js'

export default function LangSwitch({ compact }) {
  const locale = useLocale()
  return (
    <div className={'inline-flex rounded-full ring-1 ring-slate-200 ' + (compact ? 'p-0.5' : 'bg-white/70 p-1')}>
      {['en', 'zh'].map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={
            'rounded-full px-2.5 text-xs transition ' +
            (compact ? 'py-0.5' : 'py-1') +
            ' ' +
            (locale === l ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900')
          }
        >
          {l === 'en' ? 'EN' : '中'}
        </button>
      ))}
    </div>
  )
}
