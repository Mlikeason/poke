// API id → 用户可读 code
// me4      → M4
// me2pt5   → M2.5
// sv4      → SV4
// sv3pt5   → SV3.5
// rsv10pt5 → RSV10.5
// svp      → SVP
const PREFIX_MAP = {
  me: 'M',
  sv: 'SV',
  swsh: 'SWSH',
  sm: 'SM',
  xy: 'XY',
  bw: 'BW',
  hgss: 'HS',
  pl: 'PL',
  dp: 'DP',
  ex: 'EX',
  ecard: 'E',
  neo: 'N',
  gym: 'GYM',
  base: 'BS',
  pop: 'POP',
}

export function setCode(id) {
  if (!id) return ''
  const m = id.match(/^([a-z]+)(.*)$/i)
  if (!m) return id.toUpperCase()
  const [, prefix, rest] = m
  const mapped = PREFIX_MAP[prefix.toLowerCase()] ?? prefix.toUpperCase()
  const num = rest.replace(/pt5/gi, '.5').toUpperCase()
  return mapped + num
}
