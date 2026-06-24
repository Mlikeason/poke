// AI Vision API integration for card recognition
const KEY_AI_KEY = 'poke.ai.key'
const KEY_AI_HOST = 'poke.ai.host'
const KEY_AI_MODEL = 'poke.ai.model'

const DEFAULT_HOST = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen3.5-omni-flash'

export function getAiKey() {
  try { return localStorage.getItem(KEY_AI_KEY) || '' } catch { return '' }
}
export function setAiKey(key) {
  try { localStorage.setItem(KEY_AI_KEY, key.trim()) } catch {}
}
export function getAiHost() {
  try { return localStorage.getItem(KEY_AI_HOST) || DEFAULT_HOST } catch { return DEFAULT_HOST }
}
export function setAiHost(host) {
  try { localStorage.setItem(KEY_AI_HOST, host.trim()) } catch {}
}
export function getAiModel() {
  try { return localStorage.getItem(KEY_AI_MODEL) || DEFAULT_MODEL } catch { return DEFAULT_MODEL }
}
export function setAiModel(model) {
  try { localStorage.setItem(KEY_AI_MODEL, model.trim()) } catch {}
}

// Send image to Qwen vision model, extract set code and number
export async function recognizeCard(imageDataUrl) {
  const key = getAiKey()
  if (!key) throw new Error('No API key configured')

  const host = getAiHost()
  const url = `${host}/chat/completions`

  const prompt = `Look at this Pokemon trading card image. Find the small text at the bottom-left corner that shows the set code and card number.

Examples of what to look for:
- "sv10 042/165" → set code is "sv10", number is "42"
- "base1 4" → set code is "base1", number is "4"
- "EX7 14/114" → set code is "ex7", number is "14"

Reply with ONLY a JSON object like this (no other text):
{"setCode": "sv10", "number": "42"}

If you cannot read it clearly, reply:
{"setCode": null, "number": null, "reason": "brief explanation"}`

  const body = {
    model: getAiModel(),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0.1,
  }

  console.log('AI Vision request to:', url)
  console.log('API Key prefix:', key.substring(0, 10) + '...')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key.trim()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('API error:', res.status, errText)
    throw new Error(`API ${res.status}: ${errText}`)
  }

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content || ''

  // Extract JSON from response
  const match = text.match(/\{[^}]+\}/)
  if (!match) {
    throw new Error('No JSON in response')
  }

  const parsed = JSON.parse(match[0])
  return {
    setCode: parsed.setCode?.toLowerCase() || null,
    number: parsed.number ? String(parseInt(parsed.number, 10)) : null,
    raw: text,
    reason: parsed.reason,
  }
}

// Test connection with a dummy request
export async function testAiConnection() {
  const key = getAiKey()
  if (!key) throw new Error('No API key')

  const host = getAiHost()
  const url = `${host}/chat/completions`

  console.log('Testing AI connection to:', url)
  console.log('API Key prefix:', key.trim().substring(0, 10) + '...')

  const body = {
    model: getAiModel(),
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 10,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key.trim()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('API error:', res.status, errText)
    throw new Error(`API ${res.status}: ${errText}`)
  }

  return true
}
