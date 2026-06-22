import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { useSets, useCollection } from '../hooks.js'
import { buildPosterData } from '../lib/posterData.js'
import { formatSgd } from '../lib/currency.js'
import { useT } from '../lib/i18n.js'

const POKE_RED = '#EE1515'
const PIKACHU_YELLOW = '#FFCC00'

// 海报实际渲染尺寸 (像素). 4:5 比例, 适合 IG / 微信朋友圈.
const POSTER_W = 1080
const POSTER_H = 1440

export default function SharePoster({ open, onClose }) {
  const t = useT()
  const sets = useSets()
  const col = useCollection()
  const posterRef = useRef(null)
  const wrapRef = useRef(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [blob, setBlob] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [imgsReady, setImgsReady] = useState(0)
  const [generated, setGenerated] = useState(false)

  const data = useMemo(() => (sets && col ? buildPosterData(col, sets) : null), [sets, col])

  // 重置状态
  useEffect(() => {
    if (open) {
      setBlob(null)
      setErr(null)
      setImgsReady(0)
      setGenerated(false)
    }
  }, [open])

  // 计算预览缩放比例 (容器宽 / 1080)
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return
    const el = wrapRef.current
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setPreviewScale(w / POSTER_W)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // 等所有缩略图加载完, 再生成 PNG
  useEffect(() => {
    if (!open || !data || !posterRef.current || generated) return
    const total = data.topCards.length
    if (total === 0 || imgsReady >= total) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data, imgsReady, generated])

  async function generate() {
    if (busy || generated) return
    setBusy(true)
    setErr(null)
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const dataUrl = await toPng(posterRef.current, {
        width: POSTER_W,
        height: POSTER_H,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node) => node?.dataset?.skipCapture !== 'true',
      })
      const b = await (await fetch(dataUrl)).blob()
      setBlob(b)
      setGenerated(true)
    } catch (e) {
      console.error('poster generation failed', e)
      setErr(e.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleShare() {
    if (!blob) return
    const file = new File([blob], 'my-pokemon.png', { type: 'image/png' })
    const shareData = { files: [file], title: 'My Pokemon Collection' }
    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        return
      }
    } catch (e) {
      if (e.name === 'AbortError') return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `my-pokemon-${new Date().toISOString().slice(0, 10)}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!open || !data) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {/* 海报预览 (缩放显示) */}
        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
        >
          <PosterCanvas
            ref={posterRef}
            scale={previewScale}
            data={data}
            t={t}
            onImgLoad={() => setImgsReady((n) => n + 1)}
          />
        </div>

        {/* 操作栏 */}
        <div className="flex w-full gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-white"
          >
            {t('mycards.posterClose')}
          </button>
          <button
            onClick={handleShare}
            disabled={busy || !blob}
            className="flex-[2] rounded-full px-4 py-3 text-sm font-medium text-white shadow transition hover:brightness-105 disabled:opacity-50"
            style={{ background: POKE_RED }}
          >
            {busy ? t('mycards.generating') : t('mycards.posterSave')}
          </button>
        </div>

        {err && <p className="text-xs text-rose-300">{err}</p>}
      </div>
    </div>
  )
}

// 海报画布: 固定 1080x1440, 通过 scale 缩放到预览容器
// html-to-image 拿到的还是 1080x1440 自然尺寸 (transform 不影响快照像素)
const PosterCanvas = forwardRef(function PosterCanvas({ data, t, onImgLoad, scale }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: POSTER_W,
        height: POSTER_H,
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        background: '#fafafa',
        color: '#1f1d2b',
      }}
    >
      {/* 角落 Pokeball 水印 */}
      <svg
        style={{ position: 'absolute', right: -80, bottom: -80, width: 420, height: 420, opacity: 0.05 }}
        viewBox="0 0 100 100"
        fill="#1f1d2b"
      >
        <circle cx="50" cy="50" r="46" />
        <path d="M4 50h92" stroke="white" strokeWidth="6" />
        <circle cx="50" cy="50" r="14" fill="white" />
        <circle cx="50" cy="50" r="7" fill="#1f1d2b" />
      </svg>

      {/* 顶部红黄品牌条 */}
      <div style={{ display: 'flex', height: 28 }}>
        <span style={{ flex: 2, background: PIKACHU_YELLOW }} />
        <span style={{ flex: 1, background: POKE_RED }} />
      </div>

      {/* 标题区 */}
      <div style={{ padding: '64px 72px 40px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span
            style={{
              display: 'grid', placeItems: 'center',
              width: 96, height: 96, borderRadius: '50%',
              background: POKE_RED, boxShadow: '0 8px 24px rgba(238,21,21,0.25)',
            }}
          >
            <span
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'white', border: '8px solid #1f1d2b',
              }}
            />
          </span>
          <div>
            <div style={{ fontSize: 22, letterSpacing: '0.2em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('mycards.posterSource')}
            </div>
            <div
              style={{
                fontSize: 64, fontWeight: 500, letterSpacing: '-0.02em',
                color: '#1f1d2b', marginTop: 4, lineHeight: 1,
              }}
            >
              {t('mycards.posterTitle')}
            </div>
          </div>
        </div>
      </div>

      {/* 卡片网格 (2 行 × 3 列) */}
      <div style={{ padding: '0 72px 40px' }}>
        {data.topCards.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 28,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const c = data.topCards[i]
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    background: c ? '#ffffff' : '#f1f5f9',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    aspectRatio: '245 / 342',
                  }}
                >
                  {c?.img ? (
                    <img
                      src={c.img}
                      alt={c.name}
                      crossOrigin="anonymous"
                      onLoad={onImgLoad}
                      onError={onImgLoad}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        width: '100%', height: '100%', padding: 16, textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 40, fontWeight: 500, color: '#94a3b8' }}>#{c?.number || '—'}</span>
                    </div>
                  )}
                  {c?.owned > 1 && (
                    <span
                      style={{
                        position: 'absolute', right: 14, bottom: 14,
                        minWidth: 52, height: 52, padding: '0 12px',
                        display: 'grid', placeItems: 'center',
                        borderRadius: '50%', background: PIKACHU_YELLOW,
                        fontSize: 24, fontWeight: 700, color: '#1f1d2b',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      ×{c.owned}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 80,
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 24,
              color: '#64748b',
              fontSize: 28,
            }}
          >
            {t('mycards.posterEmpty')}
          </div>
        )}
      </div>

      {/* 统计区 */}
      <div
        style={{
          margin: '0 72px',
          padding: '48px 0',
          borderTop: '2px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        <Stat label={t('home.cardsWord')} value={data.owned.toLocaleString()} />
        <Stat label={t('home.stat.value')} value={formatSgd(data.valueUsd)} />
        <Stat label={t('home.stat.wanted')} value={data.wanted.toLocaleString()} />
      </div>

      {/* 底部日期 + 来源 */}
      <div
        style={{
          position: 'absolute', left: 72, right: 72, bottom: 72,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 20, color: '#94a3b8', letterSpacing: '0.1em',
        }}
      >
        <span>{data.date}</span>
        <span style={{ fontWeight: 600, color: POKE_RED }}>{t('mycards.posterSource')}</span>
      </div>
    </div>
  )
})

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 72, fontWeight: 500, letterSpacing: '-0.02em', color: '#1f1d2b', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 18, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 12 }}>
        {label}
      </div>
    </div>
  )
}
