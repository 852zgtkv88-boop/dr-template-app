import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { importOSCALFile } from './oscal.js'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const DEFAULT_CHECKLIST = [
  { id: 'criterion-1', criterion: 'Document control', requirement: 'The artifact must show current ownership and version status.', evidence: 'Current owner, revision number, and approval metadata must be visible.', weight: 1, notes: '' },
  { id: 'criterion-2', criterion: 'Completeness', requirement: 'All mandatory sections must be present.', evidence: 'Checklist sections and required fields are included.', weight: 1, notes: '' },
  { id: 'criterion-3', criterion: 'Evidence traceability', requirement: 'The item must include proof or references to the underlying support.', evidence: 'Source references, screenshots, or textual evidence should be present.', weight: 1, notes: '' },
]

const STATUS_OPTIONS = {
  met: { label: 'Met', score: 1 },
  partial: { label: 'Partially met', score: 0.5 },
  not_met: { label: 'Not met', score: 0 },
  missing_evidence: { label: 'Missing evidence', score: 0 },
}

const normalizeRow = (row) => {
  const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]))
  const criterion = values.criterion ?? values.name ?? values['checklist item'] ?? values.item ?? 'Unnamed criterion'
  const requirement = values.requirement ?? values['requirement text'] ?? values.description ?? values['description text'] ?? ''
  const evidence = values.evidence ?? values['evidence required'] ?? values['supporting evidence'] ?? ''
  const weight = Number(values.weight ?? values['score weight'] ?? values.points ?? 1)
  return {
    id: `criterion-${Math.random().toString(36).slice(2, 9)}`,
    criterion: String(criterion),
    requirement: String(requirement),
    evidence: String(evidence),
    weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
    notes: '',
  }
}

function buildAssessmentMap(checklist) {
  return Object.fromEntries(checklist.map((item) => [item.id, { status: 'not_assessed', notes: '' }]))
}

async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (file.type.startsWith('text/') || ['txt', 'md', 'csv', 'json', 'log', 'xml', 'yaml', 'yml'].includes(ext)) return file.text()
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value || ''
  }
  if (ext === 'pdf') {
    const pdf = await getDocument({ data: await file.arrayBuffer() }).promise
    const pages = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    }
    return pages.join('\n\n')
  }
  if (['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'].includes(ext)) {
    const result = await Tesseract.recognize(file, 'eng')
    return result.data?.text || ''
  }
  return ''
}

function getItemScore(assessment) {
  if (!assessment || assessment.status === 'not_assessed') return 0
  return STATUS_OPTIONS[assessment.status]?.score ?? 0
}

function parseChecklistRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_CHECKLIST
  return rows.map((row, index) => ({ ...normalizeRow(row), id: `criterion-${index + 1}` }))
}

export default function App() {
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [artifacts, setArtifacts] = useState([])
  const [selectedArtifactId, setSelectedArtifactId] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')

  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId) || artifacts[0] || null
  const totalChecklistScore = useMemo(() => {
    const totalWeight = checklist.reduce((sum, item) => sum + Number(item.weight || 1), 0)
    const achieved = checklist.reduce((sum, item) => sum + getItemScore(selectedArtifact?.assessments?.[item.id]) * Number(item.weight || 1), 0)
    return totalWeight === 0 ? 0 : (achieved / totalWeight) * 100
  }, [checklist, selectedArtifact])

  const replaceChecklist = (items) => {
    setChecklist(items)
    setArtifacts((previous) => previous.map((artifact) => ({
      ...artifact,
      assessments: buildAssessmentMap(items),
    })))
  }

  const handleChecklistImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportMessage('Reading checklist file…')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
      const imported = parseChecklistRows(rows)
      replaceChecklist(imported)
      setImportMessage(`Loaded ${imported.length} checklist items from ${file.name}.`)
    } catch (error) {
      setImportMessage(`Could not read the spreadsheet: ${error.message}`)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const handleOSCALImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportMessage('Reading OSCAL file…')
    try {
      const result = await importOSCALFile(file)
      replaceChecklist(result.rows)
      setImportMessage(`${result.message} (${file.name})`)
    } catch (error) {
      setImportMessage(error.message || 'Could not import this OSCAL file.')
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const handleArtifactUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setIsImporting(true)
    try {
      const newArtifacts = []
      for (const file of files) {
        const text = await extractTextFromFile(file)
        newArtifacts.push({
          id: `artifact-${crypto.randomUUID()}`,
          name: file.name,
          type: file.type || 'file',
          text,
          assessments: buildAssessmentMap(checklist),
        })
      }
      setArtifacts((previous) => {
        const merged = [...previous, ...newArtifacts]
        setSelectedArtifactId(newArtifacts[0]?.id || '')
        return merged
      })
    } catch (error) {
      setImportMessage(`Could not read artifact: ${error.message}`)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const updateAssessment = (artifactId, itemId, nextValue) => {
    setArtifacts((previous) => previous.map((artifact) => artifact.id !== artifactId ? artifact : ({
      ...artifact,
      assessments: {
        ...artifact.assessments,
        [itemId]: { ...artifact.assessments[itemId], ...nextValue },
      },
    })))
  }

  const exportResults = () => {
    const rows = []
    artifacts.forEach((artifact) => checklist.forEach((item) => {
      const assessment = artifact.assessments[item.id] || { status: 'not_assessed', notes: '' }
      rows.push({
        artifact: artifact.name,
        criterion: item.criterion,
        oscal_control_id: item.oscalId || '',
        requirement: item.requirement,
        status: assessment.status || 'not_assessed',
        notes: assessment.notes || '',
        evidence: item.evidence,
      })
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment')
    XLSX.writeFile(workbook, 'artifact-assessment-export.xlsx')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Checklist Assessor</h1>
        <div className="card">
          <h2>1. Import checklist</h2>
          <label className="upload-button">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleChecklistImport} />
            {isImporting ? 'Importing…' : 'Upload Excel checklist'}
          </label>
          <label className="upload-button secondary-upload">
            <input type="file" accept=".json,.xml,.yaml,.yml,application/json,application/xml,text/yaml" onChange={handleOSCALImport} />
            Import OSCAL file
          </label>
          {importMessage && <p className="info" role="status">{importMessage}</p>}
          <p className="muted small-note">OSCAL catalog files provide control text. Profiles and assessment plans import selected control references; import the source catalog for full statements.</p>
        </div>

        <div className="card">
          <h2>2. Upload artifacts</h2>
          <label className="upload-button">
            <input type="file" multiple onChange={handleArtifactUpload} />
            Upload artifact files
          </label>
        </div>

        <div className="card">
          <h2>3. Artifact list</h2>
          {artifacts.length === 0 ? <p className="muted">No artifacts uploaded yet.</p> : (
            <ul className="artifact-list">
              {artifacts.map((artifact) => (
                <li key={artifact.id}>
                  <button className={artifact.id === selectedArtifactId ? 'artifact-item active' : 'artifact-item'} onClick={() => setSelectedArtifactId(artifact.id)}>
                    {artifact.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>4. Export</h2>
          <button className="primary-button" onClick={exportResults} disabled={artifacts.length === 0 || checklist.length === 0}>Export assessment report</button>
        </div>
      </aside>

      <main className="main-panel">
        <div className="summary-grid">
          <div className="summary-box"><span>Checklist items</span><strong>{checklist.length}</strong></div>
          <div className="summary-box"><span>Artifacts</span><strong>{artifacts.length}</strong></div>
          <div className="summary-box"><span>Score</span><strong>{Math.round(totalChecklistScore)}%</strong></div>
        </div>

        {selectedArtifact ? <>
          <div className="artifact-header"><h2>{selectedArtifact.name}</h2><span>{selectedArtifact.type}</span></div>
          {selectedArtifact.text ? <div className="artifact-preview"><h3>Extracted text preview</h3><pre>{selectedArtifact.text.slice(0, 1500)}</pre></div> : <p className="muted">No text is available for this artifact. You can still evaluate it manually.</p>}
          <div className="checklist-table">
            {checklist.map((item) => {
              const assessment = selectedArtifact.assessments[item.id] || { status: 'not_assessed', notes: '' }
              return <div key={item.id} className="criterion-card">
                <div className="criterion-header">
                  <div><h3>{item.criterion}</h3><p>{item.requirement}</p>{item.group && <small className="control-group">{item.group}</small>}</div>
                  <div className="weight-pill">{item.oscalId ? `OSCAL ${item.oscalId}` : `Weight: ${item.weight}`}</div>
                </div>
                <div className="criterion-body">
                  <div className="field"><label>Evidence required / guidance</label><div className="evidence-box">{item.evidence || 'No explicit evidence guidance specified.'}</div></div>
                  <div className="field"><label>Decision</label><select value={assessment.status || 'not_assessed'} onChange={(event) => updateAssessment(selectedArtifact.id, item.id, { status: event.target.value })}>
                    <option value="not_assessed">Not assessed</option>
                    {Object.entries(STATUS_OPTIONS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                  </select></div>
                  <div className="field"><label>Reviewer notes</label><textarea rows="3" value={assessment.notes || ''} onChange={(event) => updateAssessment(selectedArtifact.id, item.id, { notes: event.target.value })} placeholder="Describe findings, evidence, or rationale..." /></div>
                </div>
              </div>
            })}
          </div>
        </> : <div className="empty-state"><h2>No artifact selected</h2><p>Upload artifacts on the left to start assessing them against the checklist.</p></div>}
      </main>
    </div>
  )
}
