#!/usr/bin/env node
// 从 SVG 渲染出 PWA / iOS home screen 用的 PNG icon
// 一次性运行 (生成的图已 commit, 平时不用跑):
//   npm i -D sharp && node scripts/gen-icons.js
// sharp 没作为常驻依赖 — 它二进制重, 拖慢 Vercel 构建
import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

// 红底, 白色 pokeball outline. iOS 风格干净
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#EE1515"/>
  <circle cx="90" cy="90" r="56" fill="none" stroke="white" stroke-width="9"/>
  <path d="M34 90h112" stroke="white" stroke-width="9" stroke-linecap="round"/>
  <circle cx="90" cy="90" r="17" fill="white"/>
  <circle cx="90" cy="90" r="9" fill="#EE1515"/>
</svg>`

const TARGETS = [
  { name: 'apple-touch-icon.png', size: 180 },   // iOS home screen
  { name: 'icon-192.png', size: 192 },           // Android / Chrome
  { name: 'icon-512.png', size: 512 },           // PWA splash
  { name: 'favicon-32.png', size: 32 },          // tab favicon fallback
]

await mkdir(PUBLIC_DIR, { recursive: true })

// 也存一个 favicon.svg 给现代浏览器
await writeFile(resolve(PUBLIC_DIR, 'favicon.svg'), SVG)
console.log('Wrote favicon.svg')

for (const { name, size } of TARGETS) {
  const out = resolve(PUBLIC_DIR, name)
  await sharp(Buffer.from(SVG)).resize(size, size).png().toFile(out)
  console.log(`Wrote ${name} (${size}x${size})`)
}

console.log('\n完成。记得在 index.html 引用 apple-touch-icon, manifest 等。')
