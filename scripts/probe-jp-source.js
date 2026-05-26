#!/usr/bin/env node
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'ja-JP',
})

// 加 stealth: 抹掉 navigator.webdriver 等自动化痕迹
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  // Chrome 才有的 navigator.plugins
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
  Object.defineProperty(navigator, 'languages', { get: () => ['ja-JP', 'ja', 'en'] })
})

const page = await ctx.newPage()

const targets = [
  'https://limitlesstcg.com/cards?game=PTCG&set=M1L',
  'https://www.tcgplayer.com/search/pokemon-japan/product?productLineName=pokemon-japan&setName=mega-brave',
  'https://bulbapedia.bulbagarden.net/wiki/Mega_Brave_(TCG)',
  'https://www.pokemon-card.com/',
]

for (const url of targets) {
  console.log(`\n== ${url} ==`)
  try {
    await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' })
    // 给 Cloudflare 自动 challenge 充足时间
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000)
      const title = await page.title()
      if (!/just a moment|お待ちください|attention required/i.test(title)) break
    }
    console.log('  title:', await page.title())
    console.log('  url:', page.url())
    const imgs = await page.$$eval('img', (els) =>
      els.map((e) => e.src).filter((s) => s).slice(0, 5),
    )
    console.log('  imgs sample:', imgs.slice(0, 3))
  } catch (e) {
    console.log('  fail:', e.message.split('\n')[0])
  }
}

await browser.close()
