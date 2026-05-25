export default function ProgressBar({ value, max, gradient }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/40">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: gradient || 'linear-gradient(90deg,#22c55e,#3b82f6)',
        }}
      />
    </div>
  )
}
