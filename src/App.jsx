import { useEffect, useMemo, useState } from 'react'
import { categories, components } from './data/catalog.js'
import { generateKonzept, generatePlan } from './generator.js'
import MarkdownView from './MarkdownView.jsx'
import { discoverComponent } from './discovery.js'
import './App.css'

const STORAGE_KEY = 'dr-template-app:custom-components'
const KEY_STORAGE = 'dr-template-app:mistral-key'

const byCategory = (catId, all) => all.filter((c) => c.category === catId)

function loadCustoms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const emptyMeta = {
  projekt: '',
  verantwortlich: '',
  stand: new Date().toISOString().slice(0, 10),
  rto: '4 Stunden',
  rpo: '15 Minuten',
}

const emptyCustom = {
  name: '',
  category: 'db',
  docs: '',
  faehigkeit: '',
  auswirkung: '',
  methodik: '',
  schritte: '',
  confidence: null,
  begruendung: '',
}

export default function App() {
  const [meta, setMeta] = useState(emptyMeta)
  const [selected, setSelected] = useState([])
  const [activeDoc, setActiveDoc] = useState('konzept')
  const [customs, setCustoms] = useState(loadCustoms)
  const [form, setForm] = useState(emptyCustom)
  const [editingId, setEditingId] = useState(null)
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(KEY_STORAGE) ?? ''
  )
  const [discovering, setDiscovering] = useState(false)
  const [discoveryError, setDiscoveryError] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs))
  }, [customs])

  useEffect(() => {
    if (apiKey) localStorage.setItem(KEY_STORAGE, apiKey)
    else localStorage.removeItem(KEY_STORAGE)
  }, [apiKey])

  const all = useMemo(() => [...components, ...customs], [customs])

  const konzept = useMemo(
    () => generateKonzept(meta, selected, customs),
    [meta, selected, customs]
  )
  const plan = useMemo(() => generatePlan(meta, selected, customs), [meta, selected, customs])
  const currentDoc = activeDoc === 'konzept' ? konzept : plan

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const selectedComponents = selected
    .map((id) => all.find((c) => c.id === id))
    .filter(Boolean)

  const set = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }))

  const slug =
    (meta.projekt || 'dr').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dr'

  const setFormValue = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const runDiscovery = async () => {
    if (!form.name.trim()) {
      setDiscoveryError('Bitte zuerst einen Namen eingeben.')
      return
    }
    if (!apiKey.trim()) {
      setDiscoveryError(
        'Bitte zuerst einen Mistral-API-Schlüssel hinterlegen (Abschnitt „KI-Discovery“).'
      )
      return
    }
    setDiscovering(true)
    setDiscoveryError('')
    try {
      const categoryLabel =
        categories.find((cat) => cat.id === form.category)?.label ?? ''
      const result = await discoverComponent(
        form.name.trim(),
        categoryLabel,
        apiKey.trim()
      )
      setForm((f) => ({
        ...f,
        faehigkeit: result.faehigkeit || f.faehigkeit,
        auswirkung: result.auswirkung || f.auswirkung,
        methodik: result.methodik || f.methodik,
        schritte: result.schritte.join('\n') || f.schritte,
        docs: result.docs || f.docs,
        confidence: result.confidence,
        begruendung: result.begruendung,
      }))
    } catch (err) {
      setDiscoveryError(
        err.message ||
          'Discovery fehlgeschlagen. Bitte Netzwerk und API-Schlüssel prüfen.'
      )
    } finally {
      setDiscovering(false)
    }
  }

  const saveCustom = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const entry = {
      id: editingId ?? `custom-${Date.now()}`,
      category: form.category,
      name: form.name.trim(),
      docs: form.docs.trim(),
      konzept: {
        faehigkeit: form.faehigkeit.trim(),
        auswirkung: form.auswirkung.trim(),
        methodik: form.methodik.trim(),
      },
      plan: {
        schritte: form.schritte
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      confidence: form.confidence,
      begruendung: form.begruendung,
    }
    setCustoms((prev) =>
      editingId ? prev.map((c) => (c.id === editingId ? entry : c)) : [...prev, entry]
    )
    setForm(emptyCustom)
    setEditingId(null)
  }

  const editCustom = (c) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      category: c.category,
      docs: c.docs,
      faehigkeit: c.konzept.faehigkeit,
      auswirkung: c.konzept.auswirkung,
      methodik: c.konzept.methodik,
      schritte: c.plan.schritte.join('\n'),
      confidence: c.confidence ?? null,
      begruendung: c.begruendung ?? '',
    })
  }

  const removeCustom = (id) => {
    setCustoms((prev) => prev.filter((c) => c.id !== id))
    setSelected((prev) => prev.filter((x) => x !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyCustom)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>DR-Template-Generator</h1>
        <p>
          Disaster-Recovery-Konzept &amp; -Plan aus Infrastrukturkomponenten
          generieren
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>1. Umgebung</h2>
          <div className="form">
            <label>
              Projekt / Umgebung
              <input
                value={meta.projekt}
                onChange={set('projekt')}
                placeholder="z. B. Shop-Produktivumgebung"
              />
            </label>
            <label>
              Verantwortlich
              <input
                value={meta.verantwortlich}
                onChange={set('verantwortlich')}
                placeholder="z. B. IT-Betrieb / Max Mustermann"
              />
            </label>
            <label>
              Stand
              <input type="date" value={meta.stand} onChange={set('stand')} />
            </label>
            <label>
              Ziel-RTO
              <input value={meta.rto} onChange={set('rto')} />
            </label>
            <label>
              Ziel-RPO
              <input value={meta.rpo} onChange={set('rpo')} />
            </label>
          </div>

          <h2>2. Infrastrukturkomponenten</h2>
          {categories.map((cat) => (
            <div key={cat.id} className="category">
              <label className="category-label">
                <span>{cat.label}</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) toggle(e.target.value)
                  }}
                >
                  <option value="">– Komponente hinzufügen –</option>
                  {byCategory(cat.id, all).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {selected.includes(c.id) ? ' (ausgewählt)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          <h2>3. Auswahl ({selectedComponents.length})</h2>
          {selectedComponents.length === 0 && (
            <p className="hint">
              Noch keine Komponenten ausgewählt. Bitte über die Dropdowns oben
              auswählen.
            </p>
          )}
          <ul className="selected-list">
            {selectedComponents.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.id.startsWith('custom-') && <em>Eigene Komponente · </em>}
                    {c.id.startsWith('custom-') &&
                      c.confidence !== null &&
                      c.confidence !== undefined && (
                        <em
                          className={
                            c.confidence >= 80
                              ? 'conf-high'
                              : c.confidence >= 50
                                ? 'conf-mid'
                                : 'conf-low'
                          }
                          title={c.begruendung}
                        >
                          Konfidenz {c.confidence}% ·{' '}
                        </em>
                      )}
                    {c.docs ? (
                      <a href={c.docs} target="_blank" rel="noreferrer">
                        Produktdokumentation
                      </a>
                    ) : (
                      c.id.startsWith('custom-') && 'ohne Doku-Link'
                    )}
                  </small>
                </span>
                <button onClick={() => toggle(c.id)} aria-label="Entfernen">
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <h2>4. Eigene Komponente hinzufügen</h2>
          <details className="settings">
            <summary>KI-Discovery: Mistral-API-Schlüssel</summary>
            <div className="settings-body">
              <label>
                API-Schlüssel (bleibt nur lokal im Browser gespeichert)
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="z. B. von console.mistral.ai"
                  autoComplete="off"
                />
              </label>
              <label>
                Modell: mistral-small-latest (fix eingestellt)
              </label>
              <p className="hint">
                Der Schlüssel wird ausschließlich im Browser gehalten und direkt
                an api.mistral.ai gesendet – er landet weder im Code noch im
                Repository. Schlüssel kostenlos erstellbar unter{' '}
                <a
                  href="https://console.mistral.ai/api-keys"
                  target="_blank"
                  rel="noreferrer"
                >
                  console.mistral.ai
                </a>
                .
              </p>
            </div>
          </details>
          <form className="custom-form" onSubmit={saveCustom}>
            <label>
              Name
              <input
                value={form.name}
                onChange={setFormValue('name')}
                placeholder="z. B. Spezial-API-Gateway"
                required
              />
            </label>
            <label>
              Kategorie
              <select value={form.category} onChange={setFormValue('category')}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Produktdokumentation (URL, optional)
              <input
                value={form.docs}
                onChange={setFormValue('docs')}
                placeholder="https://..."
              />
            </label>
            <label>
              Recovery-Fähigkeit
              <textarea
                value={form.faehigkeit}
                onChange={setFormValue('faehigkeit')}
                rows={2}
                placeholder="z. B. Hohe Recovery-Fähigkeit durch aktives/passives Cluster mit automatischem Failover."
              />
            </label>
            <label>
              Auswirkungen eines Ausfalls
              <textarea
                value={form.auswirkung}
                onChange={setFormValue('auswirkung')}
                rows={2}
                placeholder="z. B. Alle angebundenen Anwendungen sind nicht erreichbar."
              />
            </label>
            <label>
              Recovery-Methodik
              <textarea
                value={form.methodik}
                onChange={setFormValue('methodik')}
                rows={2}
                placeholder="z. B. Recovery per automatischem Failover auf den Standby-Knoten."
              />
            </label>
            <label>
              Schritte für den DR-Plan (einer pro Zeile)
              <textarea
                value={form.schritte}
                onChange={setFormValue('schritte')}
                rows={3}
                placeholder={'Failover-Status prüfen lassen\nAnwendungen neu verbinden\nFachbereich abnehmen lassen'}
              />
            </label>
            {form.confidence !== null && (
              <p
                className={`confidence ${
                  form.confidence >= 80
                    ? 'conf-high'
                    : form.confidence >= 50
                      ? 'conf-mid'
                      : 'conf-low'
                }`}
              >
                Konfidenz der KI-Angaben: {form.confidence}% – {form.begruendung}
              </p>
            )}
            <div className="custom-form-actions">
              <button
                type="button"
                className="primary"
                onClick={runDiscovery}
                disabled={discovering}
              >
                {discovering ? 'Discovery läuft…' : 'Automatisch füllen (KI)'}
              </button>
              <button type="submit" className="primary">
                {editingId ? 'Änderungen speichern' : 'Komponente hinzufügen'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyCustom)
                  }}
                >
                  Abbrechen
                </button>
              )}
            </div>
            {discoveryError && <p className="error">{discoveryError}</p>}
          </form>

          {customs.length > 0 && (
            <>
              <h3 className="custom-list-heading">Gespeicherte eigene Komponenten</h3>
              <ul className="selected-list">
                {customs.map((c) => (
                  <li key={c.id}>
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {categories.find((cat) => cat.id === c.category)?.label}
                        {selected.includes(c.id) && ' · ausgewählt'}
                      </small>
                    </span>
                    <span className="row-actions">
                      <button
                        className="mini"
                        onClick={() => toggle(c.id)}
                        title={selected.includes(c.id) ? 'Aus Auswahl entfernen' : 'Zur Auswahl hinzufügen'}
                      >
                        {selected.includes(c.id) ? '−' : '+'}
                      </button>
                      <button className="mini" onClick={() => editCustom(c)} title="Bearbeiten">
                        ✎
                      </button>
                      <button className="mini" onClick={() => removeCustom(c.id)} title="Löschen">
                        🗑
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="panel output">
          <div className="output-toolbar">
            <div className="tabs">
              <button
                className={activeDoc === 'konzept' ? 'tab active' : 'tab'}
                onClick={() => setActiveDoc('konzept')}
              >
                DR-Konzept
              </button>
              <button
                className={activeDoc === 'plan' ? 'tab active' : 'tab'}
                onClick={() => setActiveDoc('plan')}
              >
                DR-Plan (Management)
              </button>
            </div>
            <button
              className="primary"
              disabled={selectedComponents.length === 0}
              onClick={() =>
                download(
                  activeDoc === 'konzept'
                    ? `${slug}-dr-konzept.md`
                    : `${slug}-dr-plan.md`,
                  currentDoc
                )
              }
            >
              Als Markdown herunterladen
            </button>
          </div>
          <div className="doc-scroll">
            <MarkdownView markdown={currentDoc} />
          </div>
        </section>
      </main>
    </div>
  )
}
