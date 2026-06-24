import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n.js'
import { getCardsForSet } from '../lib/api.js'
import { recognizeCard, getAiKey } from '../lib/visionApi.js'

const POKE_RED = '#EE1515'

export default function ScanPage() {
  const t = useT()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [stage, setStage] = useState('idle') // idle | live | captured | scanning | results
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)
  const [rawText, setRawText] = useState('')
  const [matches, setMatches] = useState([])
  const [err, setErr] = useState(null)
  const [useAi, setUseAi] = useState(!!getAiKey())

  useEffect(() => () => stopStream(), [])

  async function startCamera() {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStage('live')
    } catch (e) {
      console.error('camera error', e)
      setErr(e.name === 'NotAllowedError' ? t('scan.denied') : t('scan.noCamera'))
    }
  }

  function stopStream() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
  }

  async function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    // Crop to the guide region (bottom-left 60% width, bottom 40% height of the visible video)
    // The guide overlay covers the bottom-left where Pokemon card codes are
    const vw = video.videoWidth
    const vh = video.videoHeight
    const cropX = 0
    const cropY = Math.floor(vh * 0.6)
    const cropW = Math.floor(vw * 0.6)
    const cropH = Math.floor(vh * 0.4)
    canvas.width = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedDataUrl(dataUrl)
    stopStream()
    setStage('scanning')
    setMatches([])
    setRawText('')
    setErr(null)

    // Try AI vision first if key is configured
    const aiKey = getAiKey()
    if (aiKey) {
      setUseAi(true)
      try {
        const result = await recognizeCard(dataUrl)
        setRawText(result.raw || '')
        if (result.setCode && result.number) {
          const found = await lookupCard({ setId: result.setCode, number: result.number })
          setMatches(found ? [found] : [])
        } else {
          setMatches([])
          if (result.reason) setErr(`AI: ${result.reason}`)
        }
        setStage('results')
        return
      } catch (e) {
        console.error('AI vision failed, falling back to OCR', e)
        // Fall through to Tesseract
      }
    }

    // Fallback to Tesseract OCR
    setUseAi(false)
    try {
      const Tesseract = await import('tesseract.js')
      const { data } = await Tesseract.recognize(dataUrl, 'eng', {})
      const text = data.text || ''
      setRawText(text)
      const parsed = parseCardCode(text)
      if (parsed) {
        const found = await lookupCard(parsed)
        setMatches(found ? [found] : [])
      }
      setStage('results')
    } catch (e) {
      console.error('OCR failed', e)
      setErr(e.message || 'OCR failed')
      setStage('results')
    }
  }

  function retry() {
    setCapturedDataUrl(null)
    setRawText('')
    setMatches([])
    setErr(null)
    setStage('idle')
  }

  function goToCard(card) {
    navigate(`/card/${card.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('scan.title')}</h1>
      <p className="text-sm text-slate-600">{t('scan.instructions')}</p>

      {/* Camera viewport — portrait, matching phone camera */}
      <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-lg ring-1 ring-slate-200">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <video
            ref={videoRef}
            playsInline
            muted
            className={'h-full w-full object-cover ' + (stage === 'live' ? '' : 'hidden')}
          />
          {capturedDataUrl && stage !== 'live' && (
            <img src={capturedDataUrl} alt="captured" className="h-full w-full object-contain bg-slate-900" />
          )}
          {stage === 'idle' && !capturedDataUrl && (
            <div className="grid h-full w-full place-items-center p-6 text-center">
              <div className="space-y-3 text-white/70">
                <CameraIcon />
                <p className="text-sm">{t('scan.help')}</p>
              </div>
            </div>
          )}
          {stage === 'scanning' && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm">{t('scan.processing')}</span>
                <span className="text-xs text-white/60">
                  {useAi ? t('scan.aiLabel') : t('scan.ocrLabel')}
                </span>
              </div>
            </div>
          )}
          {/* Scan overlay — bottom-left guide for card code */}
          {stage === 'live' && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute bottom-0 left-0 h-[40%] w-[60%] rounded-tr-2xl border-r-2 border-t-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              <div className="absolute bottom-[42%] left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-amber-300">
                {t('scan.alignHint')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {(stage === 'idle' || stage === 'results') && !capturedDataUrl && (
          <button
            onClick={startCamera}
            className="flex-1 rounded-full px-4 py-3 text-sm font-medium text-white shadow transition hover:brightness-105"
            style={{ background: POKE_RED }}
          >
            {t('scan.start')}
          </button>
        )}
        {stage === 'live' && (
          <button
            onClick={capture}
            className="flex-1 rounded-full px-4 py-3 text-sm font-medium text-white shadow transition hover:brightness-105"
            style={{ background: POKE_RED }}
          >
            {t('scan.capture')}
          </button>
        )}
        {(stage === 'results' || capturedDataUrl) && (
          <button
            onClick={retry}
            className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            {t('scan.retry')}
          </button>
        )}
      </div>

      {err && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
          {err}
        </div>
      )}

      {/* Results */}
      {stage === 'results' && (
        <div className="space-y-3">
          {matches.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                {t('scan.results')}
              </h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => goToCard(c)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <div className="grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded bg-slate-100">
                        {c.img ? (
                          <img src={c.img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-mono text-[9px] text-slate-400">#{c.number}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400">
                          #{c.number} · {c.setId}
                          {c.rarity && ` · ${c.rarity}`}
                        </div>
                      </div>
                      <span className="text-slate-300">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {matches.length === 0 && rawText && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              {t('scan.noMatch')}
            </div>
          )}
          {rawText && (
            <details className="rounded-2xl bg-white p-4 text-xs text-slate-500 ring-1 ring-slate-200">
              <summary className="cursor-pointer font-medium text-slate-600">{t('scan.rawText')}</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">{rawText}</pre>
            </details>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-white/50">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// Parse OCR output looking for Pokemon card set code + number.
// Examples: "sv10 042/165", "base1 4", "EX 7 14/114", "SVP 042"
function parseCardCode(text) {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  // Pattern 1: "sv10 042/165" or "sv10 42"
  let m = clean.match(/\b([a-z]{1,4}\d{1,2})\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?\b/i)
  if (m) {
    return { setId: m[1].toLowerCase(), number: String(parseInt(m[2], 10)) }
  }
  // Pattern 2: "EX7 14" or "ex 7 14"
  m = clean.match(/\b([a-z]{1,4})\s*(\d{1,2})\s+(\d{1,3})\b/i)
  if (m) {
    return { setId: (m[1] + m[2]).toLowerCase(), number: String(parseInt(m[3], 10)) }
  }
  return null
}

async function lookupCard({ setId, number }) {
  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(setId)}+number:${encodeURIComponent(number)}&pageSize=5`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.data || json.data.length === 0) {
      // fallback: try loading set from cache and match locally
      try {
        const cards = await getCardsForSet(setId, 'en')
        return cards.find((c) => String(parseInt(c.number, 10)) === number) || null
      } catch {
        return null
      }
    }
    const c = json.data[0]
    return {
      id: c.id,
      name: c.name,
      number: c.number,
      rarity: c.rarity || '',
      img: c.images?.small,
      setId,
    }
  } catch {
    return null
  }
}
