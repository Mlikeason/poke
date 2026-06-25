import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n.js'
import { findCardsByNumberAndTotal } from '../lib/api.js'
import { recognizeCard, getAiKey } from '../lib/visionApi.js'
import { useSets } from '../hooks.js'

const POKE_RED = '#EE1515'

// Guide box position in the display container (percentage)
const BOX_LEFT_PCT = 0.03
const BOX_BOTTOM_PCT = 0.03
const BOX_WIDTH_PCT = 0.28
const BOX_HEIGHT_PCT = 0.08

// Scan interval (ms) — ~2 FPS for OCR
const SCAN_INTERVAL_MS = 500
// Consecutive frames with same code before we trust it (1 = instant jump)
const CONFIRM_FRAMES = 1

export default function ScanPage() {
  const t = useT()
  const navigate = useNavigate()
  const sets = useSets()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const streamRef = useRef(null)
  const workerRef = useRef(null)
  const scanTimerRef = useRef(null)
  const candidateRef = useRef(null)
  const scanningRef = useRef(false)

  const [stage, setStage] = useState('idle') // idle | loading | live | captured | processing | results
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)
  const [rawText, setRawText] = useState('')
  const [matches, setMatches] = useState([])
  const [err, setErr] = useState(null)
  const [liveCode, setLiveCode] = useState('')
  const [useAi, setUseAi] = useState(false)
  const [ocrReady, setOcrReady] = useState(false)

  const hasAi = !!getAiKey()

  // Init Tesseract worker once
  useEffect(() => {
    let worker = null
    let cancelled = false
    import('tesseract.js').then(async (Tesseract) => {
      if (cancelled) return
      worker = await Tesseract.createWorker('eng')
      if (cancelled) {
        await worker.terminate()
        return
      }
      workerRef.current = worker
      setOcrReady(true)
    }).catch((e) => {
      console.error('Tesseract init failed', e)
    })
    return () => {
      cancelled = true
      if (worker) worker.terminate().catch(() => {})
      workerRef.current = null
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current)
        scanTimerRef.current = null
      }
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scan starts when stage=live + ocr ready
  useEffect(() => {
    if (stage !== 'live' || !ocrReady) return
    startAutoScan()
    return () => stopAutoScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, ocrReady])

  function stopAutoScan() {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    scanningRef.current = false
  }

  function stopStream() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
  }

  // Crop guide box region from live video, respecting object-cover transform
  function cropBoxToCanvas() {
    const video = videoRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!video || !canvas || !container || !video.videoWidth) return false

    const vw = video.videoWidth
    const vh = video.videoHeight
    const cw = container.clientWidth
    const ch = container.clientHeight

    const scale = Math.max(cw / vw, ch / vh)
    const displayedW = vw * scale
    const displayedH = vh * scale
    const offsetX = (displayedW - cw) / 2
    const offsetY = (displayedH - ch) / 2

    const boxLeft = cw * BOX_LEFT_PCT
    const boxTop = ch * (1 - BOX_BOTTOM_PCT - BOX_HEIGHT_PCT)
    const boxW = cw * BOX_WIDTH_PCT
    const boxH = ch * BOX_HEIGHT_PCT

    const cropX = Math.max(0, Math.floor((boxLeft + offsetX) / scale))
    const cropY = Math.max(0, Math.floor((boxTop + offsetY) / scale))
    const cropW = Math.min(vw - cropX, Math.floor(boxW / scale))
    const cropH = Math.min(vh - cropY, Math.floor(boxH / scale))

    if (cropW <= 0 || cropH <= 0) return false

    canvas.width = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
    return true
  }

  // Draw full video frame to canvas (for manual capture — no cropping)
  function fullFrameToCanvas() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return false
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return true
  }

  function startAutoScan() {
    if (scanningRef.current) return
    scanningRef.current = true
    candidateRef.current = null
    setLiveCode('')
    setErr(null)

    scanTimerRef.current = setInterval(async () => {
      if (!scanningRef.current) return
      if (!workerRef.current || !videoRef.current) return

      const ok = cropBoxToCanvas()
      if (!ok) return

      try {
        const { data } = await workerRef.current.recognize(canvasRef.current)
        if (!scanningRef.current) return
        const text = data.text || ''
        const parsed = parseNumberAndTotal(text)

        if (parsed) {
          const key = `${parsed.number}/${parsed.total}`
          if (candidateRef.current?.key === key) {
            candidateRef.current.count += 1
          } else {
            candidateRef.current = { key, number: parsed.number, total: parsed.total, count: 1 }
          }
          setLiveCode(key)

          if (candidateRef.current.count >= CONFIRM_FRAMES) {
            const found = findCardsByNumberAndTotal(parsed.number, parsed.total, sets)
            if (found.length > 0) {
              stopAutoScan()
              stopStream()
              setMatches(found.map(({ card, setId }) => ({ ...card, setId })))
              setRawText(text)
              setStage('results')
              setUseAi(false)
            }
          }
        } else {
          candidateRef.current = null
          setLiveCode('')
        }
      } catch (e) {
        console.warn('OCR tick failed', e)
      }
    }, SCAN_INTERVAL_MS)
  }

  async function startCamera() {
    setErr(null)
    setLiveCode('')
    setMatches([])
    setRawText('')
    setCapturedDataUrl(null)
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

  // Manual capture: send FULL FRAME to AI (no crop — AI finds the code itself)
  async function capture() {
    const ok = fullFrameToCanvas()
    if (!ok) return
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85)
    setCapturedDataUrl(dataUrl)
    stopAutoScan()
    stopStream()
    setStage('processing')
    setMatches([])
    setRawText('')
    setErr(null)

    if (hasAi) {
      setUseAi(true)
      try {
        const result = await recognizeCard(dataUrl)
        setRawText(result.raw || '')
        if (result.number && result.total) {
          const found = findCardsByNumberAndTotal(result.number, result.total, sets)
          setMatches(found.map(({ card, setId }) => ({ ...card, setId })))
        } else {
          if (result.reason) setErr(`AI: ${result.reason}`)
        }
        setStage('results')
        return
      } catch (e) {
        console.error('AI vision failed, falling back to OCR', e)
      }
    }

    // OCR on full frame
    setUseAi(false)
    try {
      if (!workerRef.current) {
        const Tesseract = await import('tesseract.js')
        workerRef.current = await Tesseract.createWorker('eng')
      }
      const { data } = await workerRef.current.recognize(dataUrl)
      const text = data.text || ''
      setRawText(text)
      const parsed = parseNumberAndTotal(text)
      if (parsed) {
        const found = findCardsByNumberAndTotal(parsed.number, parsed.total, sets)
        setMatches(found.map(({ card, setId }) => ({ ...card, setId })))
      }
    } catch (e) {
      console.error('Manual OCR failed', e)
      setErr(e.message || 'OCR failed')
    }
    setStage('results')
  }

  async function retry() {
    setCapturedDataUrl(null)
    setRawText('')
    setMatches([])
    setErr(null)
    setLiveCode('')
    candidateRef.current = null
    await startCamera()
  }

  function goToCard(card) {
    navigate(`/card/${card.id}`)
  }

  const canStartCamera = stage === 'idle' || stage === 'results'
  const isLive = stage === 'live'
  const isProcessing = stage === 'processing'
  const showResults = stage === 'results'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-medium text-slate-900">{t('scan.title')}</h1>
      <p className="text-sm text-slate-600">{t('scan.instructions')}</p>

      {/* Camera viewport */}
      <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-lg ring-1 ring-slate-200">
        <div ref={containerRef} className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <video
            ref={videoRef}
            playsInline
            muted
            className={'absolute inset-0 h-full w-full object-cover ' + (isLive ? '' : 'hidden')}
          />
          {capturedDataUrl && !isLive && (
            <img src={capturedDataUrl} alt="captured" className="absolute inset-0 h-full w-full object-contain bg-slate-900" />
          )}
          {stage === 'idle' && !capturedDataUrl && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="space-y-3 text-white/70">
                <CameraIcon />
                <p className="text-sm">{t('scan.help')}</p>
              </div>
            </div>
          )}
          {isProcessing && (
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
          {/* Live guide box + detected code indicator */}
          {isLive && (
            <div className="pointer-events-none absolute inset-0">
              <div
                className={
                  'absolute rounded border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-colors duration-200 ' +
                  (liveCode ? 'border-emerald-400' : 'border-amber-400')
                }
                style={{
                  left: `${BOX_LEFT_PCT * 100}%`,
                  bottom: `${BOX_BOTTOM_PCT * 100}%`,
                  width: `${BOX_WIDTH_PCT * 100}%`,
                  height: `${BOX_HEIGHT_PCT * 100}%`,
                }}
              />
              <div
                className="absolute rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-amber-300"
                style={{
                  left: `${BOX_LEFT_PCT * 100}%`,
                  bottom: `${(BOX_BOTTOM_PCT + BOX_HEIGHT_PCT) * 100 + 2}%`,
                }}
              >
                {liveCode ? `✓ ${liveCode}` : t('scan.alignHint')}
              </div>
              {!ocrReady && (
                <div className="absolute inset-x-0 top-4 flex justify-center">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/70">
                    {t('scan.processing')}
                  </span>
                </div>
              )}
              {ocrReady && !liveCode && (
                <div className="absolute inset-x-0 top-4 flex justify-center">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/70">
                    {t('scan.scanning')}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Capture button — bottom-right inside camera viewport */}
          {isLive && (
            <button
              onClick={capture}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-black/10 backdrop-blur transition active:scale-95"
            >
              📷 {t('scan.capture')}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canStartCamera && (
          <button
            onClick={startCamera}
            disabled={!ocrReady && stage === 'idle'}
            className="flex-1 rounded-full px-4 py-3 text-sm font-medium text-white shadow transition hover:brightness-105 disabled:opacity-50"
            style={{ background: POKE_RED }}
          >
            {stage === 'idle' && !ocrReady ? t('scan.processing') : t('scan.start')}
          </button>
        )}
        {(showResults || capturedDataUrl) && (
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
      {showResults && (
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

// Extract card number and total from OCR text — look for "XXX/YYY" pattern
function parseNumberAndTotal(text) {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  const m = clean.match(/(\d{1,3})\s*\/\s*(\d{1,3})/)
  if (m) {
    return {
      number: String(parseInt(m[1], 10)),
      total: String(parseInt(m[2], 10)),
    }
  }
  return null
}
