import { useT, useLocale, setLocale } from '../lib/i18n.js'
import { exportJson, importJson, reset } from '../lib/collection.js'
import { clearCardCache } from '../lib/api.js'

export default function Settings() {
  const t = useT()
  const locale = useLocale()

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poke-collection-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        importJson(await file.text())
        alert(t('settings.imported'))
      } catch (e) {
        alert(t('settings.importFailed', { msg: e.message }))
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (!confirm(t('settings.resetConfirm'))) return
    reset()
    clearCardCache()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-medium text-slate-900">{t('settings.title')}</h1>

      {/* Language */}
      <Section title={t('settings.language')}>
        <div className="flex gap-2">
          {[
            ['en', 'English'],
            ['zh', '中文'],
          ].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLocale(code)}
              className={
                'rounded-xl border px-4 py-2 text-sm transition ' +
                (locale === code
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Data */}
      <Section title={t('settings.data')}>
        <Row
          title={t('settings.export')}
          desc={t('settings.exportDesc')}
          action={
            <button onClick={handleExport} className={btnPrimary}>
              {t('settings.export')}
            </button>
          }
        />
        <Row
          title={t('settings.import')}
          desc={t('settings.importDesc')}
          action={
            <button onClick={handleImport} className={btnSecondary}>
              {t('settings.import')}
            </button>
          }
        />
      </Section>

      {/* Images */}
      <Section title={t('settings.images')}>
        <p className="text-sm text-slate-600">{t('settings.imagesHelp')}</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs text-emerald-300">
{`cd ~/poke
node scripts/download-images.js sv8`}
        </pre>
        <p className="text-sm text-slate-600">{t('settings.imagesHelpAll')}</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs text-emerald-300">
{`node scripts/download-images.js --all`}
        </pre>
      </Section>

      {/* Pack art */}
      <Section title={t('settings.packs')}>
        <p className="text-sm text-slate-600">{t('settings.packsHelp')}</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs text-emerald-300">
{`public/packs/sv8.jpg
public/packs/me4.png
public/packs/sv3pt5.webp`}
        </pre>
      </Section>

      {/* Danger */}
      <Section title={t('settings.danger')} tone="danger">
        <Row
          title={t('settings.reset')}
          desc={t('settings.resetDesc')}
          action={
            <button onClick={handleReset} className={btnDanger}>
              {t('settings.reset')}
            </button>
          }
        />
      </Section>
    </div>
  )
}

const btnPrimary =
  'rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700'
const btnSecondary =
  'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400'
const btnDanger =
  'rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50'

function Section({ title, tone, children }) {
  const border = tone === 'danger' ? 'border-rose-200' : 'border-slate-200'
  return (
    <section className={'space-y-4 rounded-2xl border bg-white/70 p-5 backdrop-blur ' + border}>
      <h2 className={'text-sm font-medium uppercase tracking-wider ' + (tone === 'danger' ? 'text-rose-600' : 'text-slate-500')}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ title, desc, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
