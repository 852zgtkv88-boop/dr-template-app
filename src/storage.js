const REPO = '852zgtkv88-boop/dr-template-app'
const FILE_PATH = 'custom-components.json'
const BRANCH = 'main'
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

function toBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function isValidComponent(c) {
  return (
    c &&
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    c.konzept &&
    typeof c.konzept.faehigkeit === 'string' &&
    typeof c.konzept.auswirkung === 'string' &&
    typeof c.konzept.methodik === 'string' &&
    c.plan &&
    Array.isArray(c.plan.schritte)
  )
}

export async function fetchRemoteComponents(token) {
  try {
    const headers = { Accept: 'application/vnd.github.raw+json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_URL}?ref=${BRANCH}&t=${Date.now()}`, {
      headers,
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.filter(isValidComponent) : []
  } catch {
    return []
  }
}

export function mergeComponents(remote, local) {
  const byId = new Map(remote.map((c) => [c.id, c]))
  for (const c of local) byId.set(c.id, c)
  return [...byId.values()]
}

export async function syncCustomComponents(local, token) {
  const remote = await fetchRemoteComponents(token)
  const merged = mergeComponents(remote, local)
  await pushRemoteComponents(merged, token)
  return merged
}

export async function pushRemoteComponents(components, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  let sha
  const existing = await fetch(`${API_URL}?ref=${BRANCH}`, { headers })
  if (existing.ok) {
    sha = (await existing.json()).sha
  } else if (existing.status !== 404) {
    throw new Error(
      `GitHub: Repository nicht lesbar (HTTP ${existing.status}). Token-Berechtigung prüfen.`
    )
  }

  const body = {
    message: 'Eigene DR-Komponenten aktualisieren',
    branch: BRANCH,
    content: toBase64(JSON.stringify(components, null, 2)),
  }
  if (sha) body.sha = sha

  const res = await fetch(API_URL, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'GitHub: Token abgelehnt (401/403). Fine-grained Token mit Contents: Read and write für dieses Repository verwenden.'
      )
    }
    if (res.status === 409) {
      throw new Error(
        'GitHub: Versionskonflikt (409). Seite neu laden und erneut versuchen.'
      )
    }
    throw new Error(`GitHub: Speichern fehlgeschlagen (HTTP ${res.status}).`)
  }
}
