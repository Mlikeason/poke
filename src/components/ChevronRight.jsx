// 通用 chevron 图标. 大小由父级控制, 用 currentColor 取色.
export default function ChevronRight({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
