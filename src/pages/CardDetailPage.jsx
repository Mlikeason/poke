import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSets, useCollection } from '../hooks.js'
import { findCachedCard } from '../lib/api.js'
import { incOwned, toggleWanted, setCustomPrice } from '../lib/collection.js'
import { formatPrice, DEFAULT_USD } from '../lib/currency.js'
import { setCode } from '../lib/setCode.js'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'
const PIKACHU_YELLOW = '#FFCC00'

export default function CardDetailPage() {
  const t = useT()
  const { cardId } = useParams()
  const sets = useSets()
  const col = useCollection()
  const [editingPrice, setEditingPrice] = useState(false)
  const [zoom, setZoom] = useState(false)

  const card = useMemo(() => findCachedCard(cardId), [cardId])
  const set = card ? sets?.find((s) => s.id === card.setId) : null
  const entry = card ? col.cards[card.id] || { owned: 0, wanted: false } : null
  const customPrice = card ? col.customPrices[card.id] : null
  const marketPrice = card?.price
  const effectivePrice = customPrice ?? marketPrice ?? DEFAULT_USD
  const priceSource = customPrice != null ? 'custom' : marketPrice != null ? 'market' : 'default'

  if (!card) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-slate-200">
          <p className="text-slate-500">{t('detail.notFound')}</p>
          <Link to="/search" className="mt-4 inline-block text-sm text-slate-700 underline">
            {t('search.title')} →
          </Link>
        </div>
      </div>
    )
  }

  const owned = entry.owned > 0

  function onOwnedChange(delta) {
    if (delta > 0 && navigator.vibrate) navigator.vibrate(10)
    incOwned(card.id, delta)
  }

  function onToggleWanted() {
    if (navigator.vibrate) navigator.vibrate(5)
    toggleWanted(card.id)
  }

  const src = card.img
  const srcLarge = card.imgLarge || card.img

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to={set ? `/set/${set.id}` : '/my-cards'}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        ← {t('nav.back')}
      </Link>

      {/* 大图 */}
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="block w-full overflow-hidden rounded-3xl bg-slate-50 shadow-md ring-1 ring-slate-200"
        title={t('card.zoomHint')}
      >
        {src ? (
          <img src={src} alt={card.name} className="w-full object-contain" />
        ) : (
          <div className="flex aspect-[245/342] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-200 p-6 text-center">
            <span className="font-mono text-5xl font-medium text-slate-500">#{card.number}</span>
            <span className="text-sm text-slate-600">{card.name}</span>
          </div>
        )}
      </button>

      {/* 名称 + 编号 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-medium text-slate-900">{card.name}</h1>
          <span className="shrink-0 font-mono text-sm text-slate-400">#{card.number}</span>
        </div>

        {/* Set link */}
        {set && (
          <Link
            to={`/set/${set.id}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
              {setCode(set.id)}
            </span>
            <span>{set.name}</span>
            <span className="text-slate-300">→</span>
          </Link>
        )}

        {/* Metadata grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {card.rarity && (
            <>
              <dt className="text-slate-400">{t('detail.rarity')}</dt>
              <dd className="font-medium text-slate-900">{card.rarity}</dd>
            </>
          )}
          {card.supertype && (
            <>
              <dt className="text-slate-400">{t('detail.supertype')}</dt>
              <dd className="font-medium text-slate-900">{card.supertype}</dd>
            </>
          )}
          {card.types?.length > 0 && (
            <>
              <dt className="text-slate-400">{t('detail.types')}</dt>
              <dd className="font-medium text-slate-900">{card.types.join(', ')}</dd>
            </>
          )}
          {card.hp && (
            <>
              <dt className="text-slate-400">{t('detail.hp')}</dt>
              <dd className="font-medium text-slate-900">{card.hp}</dd>
            </>
          )}
        </dl>

        {/* Price */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{t('detail.price')}</span>
            <div className="text-right">
              {editingPrice ? (
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  defaultValue={customPrice ?? marketPrice ?? ''}
                  placeholder="USD"
                  onBlur={(ev) => {
                    const v = ev.target.value.trim()
                    setCustomPrice(card.id, v === '' ? null : Number(v))
                    setEditingPrice(false)
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') ev.target.blur()
                    if (ev.key === 'Escape') setEditingPrice(false)
                  }}
                  className="w-28 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                />
              ) : (
                <button
                  onClick={() => setEditingPrice(true)}
                  title={
                    priceSource === 'custom'
                      ? t('card.priceTitleCustom')
                      : priceSource === 'market'
                        ? t('card.priceTitleMarket')
                        : t('card.priceTitleEmpty')
                  }
                  className="text-lg font-medium text-slate-900 hover:text-slate-600"
                >
                  {formatPrice(effectivePrice)}
                  {priceSource === 'market' && (
                    <span className="ml-1.5 text-[10px] text-slate-400">{t('card.market')}</span>
                  )}
                  {priceSource === 'custom' && (
                    <span className="ml-1.5 text-[10px] text-emerald-500">★</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Owned + Wanted controls */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-900">{t('detail.owned')}</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => onOwnedChange(-1)}
                disabled={entry.owned <= 0}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition active:scale-90 enabled:hover:bg-slate-100 disabled:opacity-30"
              >
                −
              </button>
              <span
                className={
                  'min-w-[2rem] text-center text-2xl font-medium tabular-nums ' +
                  (owned ? 'text-slate-900' : 'text-slate-300')
                }
              >
                {entry.owned}
              </span>
              <button
                onClick={() => onOwnedChange(1)}
                className="grid h-12 w-12 place-items-center rounded-full text-2xl font-bold text-slate-900 shadow-md transition active:scale-90 hover:brightness-95 hover:shadow-lg"
                style={{ background: PIKACHU_YELLOW }}
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={onToggleWanted}
            className={
              'grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl shadow transition active:scale-90 ' +
              (entry.wanted
                ? 'bg-rose-500 text-white'
                : 'bg-white text-slate-300 ring-1 ring-slate-200 hover:text-rose-500')
            }
            title={t('detail.wanted')}
          >
            ♥
          </button>
        </div>
      </div>

      {/* External */}
      <a
        href={`https://pokemontcg.io/cards/${card.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"
      >
        {t('detail.external')} ↗
      </a>

      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <img
            src={srcLarge || src}
            alt={card.name}
            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
