// Thin client for the break-it demo API. All endpoints are public reads
// or a rate-limited public write (POST /break) — see
// infra/break-it-demo for the backend and its abuse/cost protections.

const API_URL = process.env.REACT_APP_BREAK_IT_API_URL
const API_KEY = process.env.REACT_APP_BREAK_IT_API_KEY

function isConfigured() {
  return !!API_URL
}

async function request(path, options = {}) {
  if (!isConfigured()) {
    throw new Error('break-it API not configured')
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export function isBreakItConfigured() {
  return isConfigured()
}

export function fetchStatus() {
  return request('/status')
}

export function fetchCost() {
  return request('/cost')
}

export function breakSomething() {
  return request('/break', { method: 'POST' })
}
