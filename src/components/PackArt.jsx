import { useState } from 'react'

// 卡包 wrapper 图. 如果用户在 public/packs/<setId>.{png|jpg|webp} 放了图就显示, 否则:
// - hideIfMissing=true: 返回 null (调用方应自己根据 onResolve 隐藏 wrapper)
// - 默认: 回退到 logo + 渐变背景
const EXTS = ['png', 'jpg', 'jpeg', 'webp']

export default function PackArt({ setId, logo, alt, className, gradient, hideIfMissing, onResolve }) {
  const base = `${import.meta.env.BASE_URL}packs/${setId}`
  const [extIdx, setExtIdx] = useState(0)
  const [failed, setFailed] = useState(false)

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
      className={'object-cover ' + (className || '')}
      onError={() => {
        if (extIdx < EXTS.length - 1) {
          setExtIdx(extIdx + 1)
        } else {
          setFailed(true)
          onResolve?.(false)
        }
      }}
      onLoad={() => onResolve?.(true)}
    />
  )
}
