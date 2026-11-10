import { useMemo, useState } from 'react'
import { categories, components } from './data/catalog.js'
import { generateKonzept, generatePlan } from './generator.js'
import './App.css'

const byCategory = (catId) => components.filter((c) => c.category === catId)

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

export default function App() {
  const [meta, setMeta] = useState(emptyMeta)
  const [selected, setSelected] = useState([])
  const [activeDoc, setActiveDoc] = useState('konzept')

  const konzept = useMemo(
    () => generateKonzept(meta, selected),
    [meta, selected]
  )
  const plan = useMemo(() => generatePlan(meta, selected), [meta, selected])
  const currentDoc = activeDoc === 'konzept' ? konzept : plan

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const selectedComponents = selected
    .map((id) => components.find((c) => c.id === id))
    .filter(Boolean)

  const set = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }))

  const slug =
    (meta.projekt || 'dr').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dr'

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
                  {byCategory(cat.id).map((c) => (
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
                    <a
                      href={c.docs}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Produktdokumentation
                    </a>
                  </small>
                </span>
                <button onClick={() => toggle(c.id)} aria-label="Entfernen">
                  ✕
                </button>
              </li>
            ))}
          </ul>
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
          <pre className="doc">{currentDoc}</pre>
        </section>
      </main>
    </div>
  )
}
