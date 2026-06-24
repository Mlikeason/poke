import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n.js'
import { findCardsByNumber } from '../lib/api.js'
import { recognizeCard, getAiKey } from '../lib/visionApi.js'
import { useSets } from '../hooks.js'

const POKE_RED = '#EE1515'

export default function ScanPage() {
  const t = useT()
  const navigate = useNavigate()
  const sets = useSets()
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
    // Crop to the guide region (bottom-left of card where set code + number is)
    const vw = video.videoWidth
    const vh = video.videoHeight
    const cropX = Math.floor(vw * 0.15)
    const cropY = Math.floor(vh * 0.75)
    const cropW = Math.floor(vw * 0.45)
    const cropH = Math.floor(vh * 0.2)
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
        if (result.number) {
          const found = findCardsByNumber(result.number)
          setMatches(found.map(({ card, setId }) => ({ ...card, setId })))
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
      const number = parseNumber(text)
      if (number) {
        const found = findCardsByNumber(number)
        setMatches(found.map(({ card, setId }) => ({ ...card, setId })))
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
              <div
                className="absolute rounded-lg border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                style={{ left: '15%', bottom: '5%', width: '45%', height: '20%' }}
              />
              <div
                className="absolute rounded-md bg-black/60 px-2 py-1 text-[10px] text-amber-300"
                style={{ left: '15%', bottom: '27%' }}
              >
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
                {matches.map((c) => {
                  const set = sets?.find((s) => s.id === c.setId)
                  return (
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
                          <div className="truncate text-[10px] text-slate-400">
                            #{c.number} · {set?.name || c.setId}
                            {c.rarity && ` · ${c.rarity}`}
                          </div>
                        </div>
                        <span className="text-slate-300">→</span>
                      </button>
                    </li>
                  )
                })}
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

// Extract card number from OCR text — look for "XXX/YYY" pattern, return the left number
function parseNumber(text) {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  // Pattern: "042/165" or "247 / 191" — return the number before the slash
  const m = clean.match(/(\d{1,3})\s*\/\s*\d{1,3}/)
  if (m) {
    return String(parseInt(m[1], 10))
  }
  return null
}
