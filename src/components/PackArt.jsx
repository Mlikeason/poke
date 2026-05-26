import { useState } from 'react'
import { useMode } from '../lib/mode.js'

// 卡包 wrapper 图. 根据 mode 找:
//   EN mode → public/packs/<setId>.{ext}
//   JP mode → public/packs/jp/<setId>.{ext}
// 没找到的处理:
//   hideIfMissing=true: 返回 null (调用方根据 onResolve 隐藏 wrapper)
//   默认: 回退 logo + gradient
const EXTS = ['png', 'jpg', 'jpeg', 'webp']

export default function PackArt({ setId, logo, alt, className, gradient, hideIfMissing, onResolve }) {
  const mode = useMode()
  const base = mode === 'jp'
    ? `${import.meta.env.BASE_URL}packs/jp/${setId}`
    : `${import.meta.env.BASE_URL}packs/${setId}`
  const [extIdx, setExtIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  // 横向 logo 占位图 (>1 aspect) 不裁切, 上下留白
  const [wide, setWide] = useState(false)

  if (failed) {
    if (hideIfMissing) return null
    return (
      <div
        className={'grid place-items-center ' + (className || '')}
        style={gradient ? { background: gradient } : undefined}
      >
        {logo && (
          <img src={logo} alt={alt} className="max-h-[80%] max-w-[85%] object-contain drop-shadow" />
        )}
      </div>
    )
  }

  return (
    <img
      src={`${base}.${EXTS[extIdx]}`}
      alt={alt}
      loading="lazy"
      className={(wide ? 'object-contain' : 'object-cover') + ' ' + (className || '')}
      onError={() => {
        if (extIdx < EXTS.length - 1) {
          setExtIdx(extIdx + 1)
        } else {
          setFailed(true)
          onResolve?.(false)
        }
      }}
      onLoad={(ev) => {
        const img = ev.currentTarget
        if (img.naturalWidth > img.naturalHeight) setWide(true)
        onResolve?.(true)
      }}
    />
  )
}
