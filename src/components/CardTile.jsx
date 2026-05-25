import { useState } from 'react'
import { incOwned, toggleWanted, setCustomPrice, totalOwned } from '../lib/collection.js'
import { useT } from '../lib/i18n.js'
import { formatSgd, DEFAULT_USD } from '../lib/currency.js'
import { setCode } from '../lib/setCode.js'

const PIKACHU_YELLOW = '#FFCC00'
const POKE_RED = '#EE1515'

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
  const e = entry || { en: 0, jp: 0, wanted: false }
  const total = totalOwned(e)
  const owned = total > 0
  const wanted = e.wanted
  const [zoom, setZoom] = useState(false)
  const [editingPrice, setEditingPrice] = useState(false)

  const marketPrice = card.price
  const effectivePrice = customPrice ?? marketPrice ?? DEFAULT_USD
  const priceSource = customPrice != null ? 'custom' : marketPrice != null ? 'market' : 'default'

  const rarityCls = RARITY_TONE[card.rarity] || 'bg-slate-100 text-slate-600'

  const src = localImageBase ? `${localImageBase}/${card.number}.png` : card.img
  const srcLarge = localImageBase ? `${localImageBase}/${card.number}_hires.png` : card.imgLarge

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
        {/* 图片区 + overlays */}
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
                if (ev.currentTarget.src !== card.img && card.img) {
                  ev.currentTarget.src = card.img
                }
              }}
            />
          ) : (
            <div className="grid aspect-[245/342] place-items-center text-slate-300">·</div>
          )}

          {/* 顶左: wanted heart toggle (常驻, 状态不同样式) */}
          {!readonly && (
            <span
              role="button"
              onClick={(ev) => {
                ev.stopPropagation()
                ev.preventDefault()
                toggleWanted(card.id)
              }}
              className={
                'absolute left-2 top-2 grid h-7 w-7 cursor-pointer place-items-center rounded-full text-sm shadow transition active:scale-90 ' +
                (wanted
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/85 text-slate-300 hover:text-rose-500 backdrop-blur')
              }
            >
              ♥
            </span>
          )}

          {/* 右下: 总持有 ×N badge (overlay on image) */}
          {owned && (
            <span
              className="absolute bottom-2 right-2 grid h-7 min-w-[1.75rem] place-items-center rounded-full px-1.5 text-xs font-semibold text-slate-900 shadow-md"
              style={{ background: PIKACHU_YELLOW }}
            >
              ×{total}
            </span>
          )}

          {/* 可选: set code (在 my-cards 这种跨 set 列表中) */}
          {showSet && card.setId && (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur">
              {setCode(card.setId)}
            </span>
          )}
        </button>

        {/* 信息条 */}
        <div className="space-y-1 p-2">
          {/* 名称 + 稀有度 (内联省一行) + 编号 */}
          <div className="flex items-baseline justify-between gap-1.5">
            <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
              <h4 className="shrink truncate text-sm font-medium text-slate-900" title={card.name}>{card.name}</h4>
              {card.rarity && (
                <span
                  className={'shrink-0 truncate rounded px-1 text-[9px] leading-relaxed ' + rarityCls}
                  title={card.rarity}
                >
                  {card.rarity}
                </span>
              )}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-slate-400">#{card.number}</span>
          </div>

          {/* 价格 */}
          <div className="text-[11px]">
            {readonly ? (
              <div className="flex items-center justify-between text-slate-600">
                <span>{formatSgd(effectivePrice)}</span>
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
                <span>{formatSgd(effectivePrice)}</span>
                {priceSource === 'market' && <span className="text-[9px] text-slate-400">{t('card.market')}</span>}
                {priceSource === 'custom' && <span className="text-[9px] text-emerald-500">★</span>}
                {priceSource === 'default' && <span className="text-[9px] text-slate-300">·</span>}
              </button>
            )}
          </div>

          {/* EN/JP 双计数器 (非 readonly) */}
          {!readonly && (
            <div className="flex items-center justify-between gap-1 pt-1">
              <Counter
                lang="en"
                label={t('card.lang.en')}
                count={e.en || 0}
                onInc={() => incOwned(card.id, 1, 'en')}
                onDec={() => incOwned(card.id, -1, 'en')}
                accent={PIKACHU_YELLOW}
                accentText="#1f1d2b"
              />
              <Counter
                lang="jp"
                label={t('card.lang.jp')}
                count={e.jp || 0}
                onInc={() => incOwned(card.id, 1, 'jp')}
                onDec={() => incOwned(card.id, -1, 'jp')}
                accent={POKE_RED}
                accentText="#ffffff"
              />
            </div>
          )}
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

function Counter({ label, count, onInc, onDec, accent, accentText }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <button
        onClick={onDec}
        disabled={count <= 0}
        className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 text-slate-600 transition active:scale-90 enabled:hover:bg-slate-100 disabled:opacity-30"
      >
        −
      </button>
      <span className={'min-w-[1rem] text-center text-xs font-medium ' + (count > 0 ? 'text-slate-900' : 'text-slate-300')}>
        {count}
      </span>
      <button
        onClick={onInc}
        className="grid h-6 w-6 place-items-center rounded-full text-sm font-semibold shadow transition active:scale-90 hover:brightness-95"
        style={{ background: accent, color: accentText }}
      >
        +
      </button>
    </div>
  )
}
