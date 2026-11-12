import { XMLParser } from 'fast-xml-parser'
import { parse as parseYaml } from 'yaml'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
  isArray: (name) =>
    ['group', 'control', 'part', 'paragraph', 'p', 'include-controls', 'include-all', 'control-selection', 'select', 'import', 'param'].includes(name),
})

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value])

function text(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') return text(value['#text'] ?? value.value ?? '')
  return ''
}

function attrOrValue(node, key) {
  if (node == null) return ''
  if (typeof node !== 'object') return text(node)
  return text(node[`@_${key}`] ?? node[key] ?? node['#text'] ?? '')
}

function collectProse(parts, wantedNames = null) {
  const output = []
  for (const part of asArray(parts)) {
    if (!part || typeof part !== 'object') continue
    const name = attrOrValue(part, 'name')
    const prose = asArray(part.prose).map(text).filter(Boolean).join('\n')
    if (prose && (!wantedNames || wantedNames.has(name))) output.push(prose)
    output.push(...collectProse(part.parts, wantedNames))
  }
  return [...new Set(output)].join('\n\n')
}

function controlsFromGroups(groups, parent = '') {
  const results = []
  for (const group of asArray(groups)) {
    if (!group || typeof group !== 'object') continue
    const groupTitle = attrOrValue(group, 'title') || parent
    for (const control of asArray(group.control)) {
      results.push(...controlTree(control, groupTitle))
    }
    results.push(...controlsFromGroups(group.group, groupTitle))
  }
  return results
}

function controlTree(control, group = '') {
  if (!control || typeof control !== 'object') return []
  const controlId = attrOrValue(control, 'id')
  if (!controlId) return asArray(control.control).flatMap((child) => controlTree(child, group))

  const title = text(control.title) || controlId
  const statement = collectProse(control.parts, new Set(['statement']))
  const guidance = collectProse(control.parts, new Set(['guidance', 'assessment-objective', 'assessment-method']))
  const row = {
    id: `oscal-${controlId}`,
    oscalId: controlId,
    group,
    criterion: `${controlId} — ${title}`,
    requirement: statement || title,
    evidence: guidance,
    weight: 1,
    notes: '',
  }
  return [row, ...asArray(control.control).flatMap((child) => controlTree(child, group))]
}

function collectControlIds(value, found = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectControlIds(item, found))
    return found
  }
  if (!value || typeof value !== 'object') return found

  for (const [key, child] of Object.entries(value)) {
    if (key === 'control-id') {
      const id = attrOrValue(child, 'control-id') || text(child)
      if (id) found.add(id)
    }
    collectControlIds(child, found)
  }
  return found
}

function selectedControlRows(model, modelType) {
  const ids = [...collectControlIds(model)].sort()
  if (ids.length === 0) {
    throw new Error(`${modelType} contains no explicit control IDs to import. Import its source catalog or select controls in the OSCAL file.`)
  }
  return ids.map((controlId) => ({
    id: `oscal-${controlId}`,
    oscalId: controlId,
    criterion: `${controlId} — control selected in ${modelType}`,
    requirement: 'The OSCAL file selects this control but does not contain its catalog statement. Import the source catalog for the full control text.',
    evidence: '',
    weight: 1,
    notes: '',
  }))
}

export async function importOSCALFile(file) {
  const raw = await file.text()
  const extension = file.name.split('.').pop()?.toLowerCase()
  let parsed

  try {
    if (extension === 'xml') parsed = xmlParser.parse(raw)
    else if (extension === 'yaml' || extension === 'yml') parsed = parseYaml(raw)
    else if (extension === 'json') parsed = JSON.parse(raw)
    else {
      try {
        parsed = JSON.parse(raw)
      } catch {
        try {
          parsed = xmlParser.parse(raw)
        } catch {
          parsed = parseYaml(raw)
        }
      }
    }
  } catch (error) {
    throw new Error(`Could not parse the OSCAL file: ${error.message}`)
  }

  const catalog = parsed?.catalog
  if (catalog) {
    const controls = [
      ...asArray(catalog.control).flatMap((control) => controlTree(control)),
      ...controlsFromGroups(catalog.groups?.group ?? catalog.group),
    ]
    if (controls.length === 0) throw new Error('The OSCAL catalog contains no controls.')
    return { type: 'catalog', rows: controls, message: `Imported ${controls.length} controls from OSCAL catalog.` }
  }

  const profile = parsed?.profile
  if (profile) {
    const rows = selectedControlRows(profile, 'OSCAL profile')
    return {
      type: 'profile',
      rows,
      message: `Imported ${rows.length} selected control references from OSCAL profile. Import the source catalog to assess full control statements.`,
    }
  }

  const assessmentPlan = parsed?.['assessment-plan'] ?? parsed?.assessmentPlan
  if (assessmentPlan) {
    const rows = selectedControlRows(assessmentPlan, 'OSCAL assessment plan')
    return {
      type: 'assessment-plan',
      rows,
      message: `Imported ${rows.length} control references from OSCAL assessment plan. Import the source catalog to assess full control statements.`,
    }
  }

  throw new Error('Unsupported OSCAL model. Supported models are catalog, profile, and assessment-plan.')
}
