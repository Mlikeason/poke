import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
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
  const [blob, setBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [imgsReady, setImgsReady] = useState(0)
  const [generated, setGenerated] = useState(false)

  const data = useMemo(() => (sets && col ? buildPosterData(col, sets) : null), [sets, col])

  // 重置状态
  useEffect(() => {
    if (open) {
      setBlob(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setErr(null)
      setImgsReady(0)
      setGenerated(false)
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // 双 rAF 确保浏览器已经把 off-screen 元素 layout 完
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
      setPreviewUrl(URL.createObjectURL(b))
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
        {/* 海报预览: 直接显示生成的 blob 图片 (保证视觉和下载完全一致) */}
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-slate-800 shadow-2xl"
          style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="poster preview" className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <div className="flex flex-col items-center gap-3 text-white/80">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm">{t('mycards.generating')}</span>
              </div>
            </div>
          )}
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

      {/* Off-screen 海报画布: 真实 1080x1440 渲染, 不被 scale 污染, 保证截图像素准确 */}
      <div
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: POSTER_W,
          height: POSTER_H,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <PosterCanvas
          ref={posterRef}
          data={data}
          t={t}
          onImgLoad={() => setImgsReady((n) => n + 1)}
        />
      </div>
    </div>
  )
}

// 海报画布: 固定 1080x1440, 不做任何 CSS transform
const PosterCanvas = forwardRef(function PosterCanvas({ data, t, onImgLoad }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: POSTER_W,
        height: POSTER_H,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        background: '#fafafa',
        color: '#1f1d2b',
        position: 'relative',
        overflow: 'hidden',
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
      <div style={{ padding: '40px 60px 28px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span
            style={{
              display: 'grid', placeItems: 'center',
              width: 80, height: 80, borderRadius: '50%',
              background: POKE_RED, boxShadow: '0 8px 24px rgba(238,21,21,0.25)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'white', border: '7px solid #1f1d2b',
              }}
            />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 18, letterSpacing: '0.2em', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('mycards.posterSource')}
            </div>
            <div
              style={{
                fontSize: 52, fontWeight: 500, letterSpacing: '-0.02em',
                color: '#1f1d2b', marginTop: 2, lineHeight: 1.05,
              }}
            >
              {t('mycards.posterTitle')}
            </div>
          </div>
        </div>
      </div>

      {/* 卡片网格: 4 列 × 4 行 = 16 张 */}
      <div style={{ padding: '0 60px 28px' }}>
        {data.topCards.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const c = data.topCards[i]
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    background: c ? '#ffffff' : '#f1f5f9',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
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
                        width: '100%', height: '100%', padding: 8, textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 500, color: '#94a3b8' }}>#{c?.number || '—'}</span>
                    </div>
                  )}
                  {c?.owned > 1 && (
                    <span
                      style={{
                        position: 'absolute', right: 6, bottom: 6,
                        minWidth: 28, height: 28, padding: '0 6px',
                        display: 'grid', placeItems: 'center',
                        borderRadius: '50%', background: PIKACHU_YELLOW,
                        fontSize: 13, fontWeight: 700, color: '#1f1d2b',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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
              padding: 60,
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 20,
              color: '#64748b',
              fontSize: 24,
            }}
          >
            {t('mycards.posterEmpty')}
          </div>
        )}
      </div>

      {/* 统计区 */}
      <div
        style={{
          margin: '0 60px',
          padding: '32px 0',
          borderTop: '2px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}
      >
        <Stat label={t('home.cardsWord')} value={data.owned.toLocaleString()} />
        <Stat label={t('home.stat.value')} value={formatSgd(data.valueUsd)} />
        <Stat label={t('home.stat.wanted')} value={data.wanted.toLocaleString()} />
      </div>

      {/* 底部日期 + 来源 */}
      <div
        style={{
          position: 'absolute', left: 60, right: 60, bottom: 40,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 18, color: '#94a3b8', letterSpacing: '0.1em',
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
      <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', color: '#1f1d2b', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 15, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 8 }}>
        {label}
      </div>
    </div>
  )
}
