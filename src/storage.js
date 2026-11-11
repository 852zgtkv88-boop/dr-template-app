const REPO = '852zgtkv88-boop/dr-template-app'
const BRANCH = 'main'
const FILES = {
  components: 'custom-components.json',
  audit: 'audit-trail.json',
  documents: 'documents.json',
}
const API_BASE = `https://api.github.com/repos/${REPO}/contents`

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

async function fetchRepoFile(path, token) {
  try {
    const headers = { Accept: 'application/vnd.github.raw+json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/${path}?ref=${BRANCH}&t=${Date.now()}`, {
      headers,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function pushRepoFile(path, data, token, message) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
  const url = `${API_BASE}/${path}`

  let sha
  const existing = await fetch(`${url}?ref=${BRANCH}`, { headers })
  if (existing.ok) {
    sha = (await existing.json()).sha
  } else if (existing.status !== 404) {
    throw new Error(
      `GitHub: Repository nicht lesbar (HTTP ${existing.status}). Token-Berechtigung prüfen.`
    )
  }

  const body = {
    message,
    branch: BRANCH,
    content: toBase64(JSON.stringify(data, null, 2)),
  }
  if (sha) body.sha = sha

  const res = await fetch(url, {
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

export async function fetchRemoteComponents(token) {
  const data = await fetchRepoFile(FILES.components, token)
  return Array.isArray(data) ? data.filter(isValidComponent) : []
}

export function mergeComponents(remote, local) {
  const byId = new Map(remote.map((c) => [c.id, c]))
  for (const c of local) byId.set(c.id, c)
  return [...byId.values()]
}

export async function syncCustomComponents(local, token, removedIds = []) {
  const remote = await fetchRemoteComponents(token)
  const merged = mergeComponents(remote, local).filter(
    (c) => !removedIds.includes(c.id)
  )
  await pushRepoFile(FILES.components, merged, token, 'Eigene DR-Komponenten aktualisieren')
  return merged
}

export async function fetchAuditTrail(token) {
  const data = await fetchRepoFile(FILES.audit, token)
  return Array.isArray(data) ? data : []
}

export async function appendAuditEntry(entry, token) {
  const remote = (await fetchRepoFile(FILES.audit, token)) ?? []
  const ids = new Set(remote.map((a) => a.id))
  const merged = [...remote, ...(ids.has(entry.id) ? [] : [entry])]
  await pushRepoFile(FILES.audit, merged, token, 'Audit-Trail aktualisieren')
  return merged
}

export async function fetchDocuments(token) {
  const data = await fetchRepoFile(FILES.documents, token)
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
}

export async function pushDocuments(docs, token) {
  await pushRepoFile(FILES.documents, docs, token, 'DR-Dokumente aktualisieren')
}
