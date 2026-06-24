// AI Vision API integration for card recognition
const KEY_AI_KEY = 'poke.ai.key'
const KEY_AI_HOST = 'poke.ai.host'
const KEY_AI_MODEL = 'poke.ai.model'

const DEFAULT_HOST = 'https://api.z.ai/api/paas/v4'
const DEFAULT_MODEL = 'glm-4.6v-flash'

export function getAiKey() {
  try { return localStorage.getItem(KEY_AI_KEY) || '' } catch { return '' }
}
export function setAiKey(key) {
  try { localStorage.setItem(KEY_AI_KEY, key.trim()) } catch {}
}
export function getAiHost() {
  try {
    const stored = localStorage.getItem(KEY_AI_HOST)
    if (!stored) return DEFAULT_HOST
    if (stored.includes('dashscope.aliyuncs.com')) {
      localStorage.setItem(KEY_AI_HOST, DEFAULT_HOST)
      return DEFAULT_HOST
    }
    return stored
  } catch {
    return DEFAULT_HOST
  }
}
export function setAiHost(host) {
  try { localStorage.setItem(KEY_AI_HOST, host.trim()) } catch {}
}
export function getAiModel() {
  try {
    const stored = localStorage.getItem(KEY_AI_MODEL)
    if (!stored) return DEFAULT_MODEL
    if (stored.includes('qwen')) {
      localStorage.setItem(KEY_AI_MODEL, DEFAULT_MODEL)
      return DEFAULT_MODEL
    }
    return stored
  } catch {
    return DEFAULT_MODEL
  }
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

  const prompt = `This is a close-up photo of a Pokemon trading card corner. Find the card number — it looks like "042/165" or "247/191" where the number before the slash is the card number and after is the total.

Reply with ONLY a JSON object (no other text):
{"number": "42", "total": "165"}

Strip leading zeros. If you cannot read it, reply:
{"number": null, "total": null, "reason": "brief explanation"}`

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
    number: parsed.number ? String(parseInt(parsed.number, 10)) : null,
    total: parsed.total ? String(parseInt(parsed.total, 10)) : null,
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
