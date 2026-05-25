import { useState } from 'react'
import { incOwned, toggleWanted, setCustomPrice } from '../lib/collection.js'
import { useT } from '../lib/i18n.js'
import { formatSgd } from '../lib/currency.js'
import { setCode } from '../lib/setCode.js'

const RARITY_TONE = {
  Common: 'bg-slate-100 text-slate-600',
  Uncommon: 'bg-emerald-100 text-emerald-700',
  Rare: 'bg-amber-100 text-amber-700',
  'Rare Holo': 'bg-amber-200 text-amber-800',
  'Rare Ultra': 'bg-fuchsia-100 text-fuchsia-700',
  'Rare Secret': 'bg-purple-200 text-purple-800',
  'Rare Rainbow': 'bg-gradient-to-r from-pink-100 to-cyan-100 text-slate-800',
}

export default function CardTile({ card, entry, customPrice, localImageBase, showSet, readonly }) {
  const t = useT()
  const e = entry || { owned: 0, wanted: false }
  const owned = e.owned > 0
  const wanted = e.wanted
  const [zoom, setZoom] = useState(false)
  const [editingPrice, setEditingPrice] = useState(false)

  const marketPrice = card.price
  const effectivePrice = customPrice ?? marketPrice
  const priceSource = customPrice != null ? 'custom' : marketPrice != null ? 'market' : null

  const rarityCls = RARITY_TONE[card.rarity] || 'bg-slate-100 text-slate-600'

  // 本地图优先 (downloaded by scripts/download-images.js)
  const src = localImageBase ? `${localImageBase}/${card.number}.png` : card.img
  const srcLarge = localImageBase ? `${localImageBase}/${card.number}_hires.png` : card.imgLarge

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
        {/* 图片 */}
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="relative block w-full bg-slate-50"
          title={t('card.zoomHint')}
        >
          {src ? (
            <img
              src={src}
              alt={card.name}
              loading="lazy"
              className="aspect-[245/342] w-full object-contain"
              onError={(ev) => {
                // 本地图找不到, 回退到 API
                if (ev.currentTarget.src !== card.img && card.img) {
                  ev.currentTarget.src = card.img
                }
              }}
            />
          ) : (
            <div className="grid aspect-[245/342] place-items-center text-slate-300">·</div>
          )}
          {owned && (
            <span className="absolute right-2 top-2 grid h-7 min-w-[1.75rem] place-items-center rounded-full bg-emerald-500 px-1.5 text-xs font-medium text-white shadow-md">
              ×{e.owned}
            </span>
          )}
          {wanted && (
            <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-sm text-white shadow-md">
              ♥
            </span>
          )}
          {showSet && card.setId && (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur">
              {setCode(card.setId)}
            </span>
          )}
        </button>

        {/* 信息条 */}
        <div className="space-y-1 p-2">
          <div className="flex items-baseline justify-between gap-1">
            <h4 className="truncate text-sm font-medium text-slate-900" title={card.name}>{card.name}</h4>
            <span className="shrink-0 font-mono text-[10px] text-slate-400">#{card.number}</span>
          </div>
          {card.rarity && (
            <span className={'inline-block rounded px-1.5 py-0.5 text-[10px] ' + rarityCls}>{card.rarity}</span>
          )}

          {/* 控制条 (非 readonly) */}
          {!readonly && (
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => incOwned(card.id, -1)}
                  disabled={e.owned <= 0}
                  className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-600 transition active:scale-90 enabled:hover:bg-slate-100 disabled:opacity-30"
                >
                  −
                </button>
                <span className={'min-w-[1.5rem] text-center text-sm font-medium ' + (owned ? 'text-slate-900' : 'text-slate-300')}>
                  {e.owned}
                </span>
                <button
                  onClick={() => incOwned(card.id, 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow transition active:scale-90 hover:bg-emerald-600"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => toggleWanted(card.id)}
                title={t('header.wanted')}
                className={
                  'grid h-7 w-7 place-items-center rounded-full transition active:scale-90 ' +
                  (wanted ? 'bg-rose-500 text-white' : 'border border-slate-200 text-slate-400 hover:text-rose-500')
                }
              >
                ♥
              </button>
            </div>
          )}

          {/* 价格 (SGD). readonly 时不可编辑 */}
          <div className="pt-1 text-[11px]">
            {readonly ? (
              <div className="flex items-center justify-between text-slate-600">
                <span>{effectivePrice != null ? formatSgd(effectivePrice) : '—'}</span>
                {priceSource === 'market' && <span className="text-[9px] text-slate-400">{t('card.market')}</span>}
                {priceSource === 'custom' && <span className="text-[9px] text-emerald-500">★</span>}
              </div>
            ) : editingPrice ? (
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
                className="w-full rounded border border-slate-200 px-1 py-0.5 text-xs"
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
                className="flex w-full items-center justify-between rounded text-left text-slate-500 hover:text-slate-900"
              >
                <span>
                  {effectivePrice != null ? formatSgd(effectivePrice) : t('card.addPrice')}
                </span>
                {priceSource === 'market' && <span className="text-[9px] text-slate-400">{t('card.market')}</span>}
                {priceSource === 'custom' && <span className="text-[9px] text-emerald-500">★</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 放大 modal */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <img
            src={srcLarge || src}
            alt={card.name}
            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl"
            onError={(ev) => {
              if (ev.currentTarget.src !== (card.imgLarge || card.img) && (card.imgLarge || card.img)) {
                ev.currentTarget.src = card.imgLarge || card.img
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
