import { components } from './data/catalog.js'

const fmtDate = (iso) => {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return iso
}

export function generateKonzept(meta, selectedIds) {
  const sel = selectedIds
    .map((id) => components.find((c) => c.id === id))
    .filter(Boolean)
  const lines = []
  lines.push(`# Disaster-Recovery-Konzept: ${meta.projekt}`)
  lines.push('')
  lines.push(`| | |`)
  lines.push(`|---|---|`)
  lines.push(`| Dokument | DR-Konzept (technisch) |`)
  lines.push(`| Projekt / Umgebung | ${meta.projekt} |`)
  lines.push(`| Stand | ${fmtDate(meta.stand)} |`)
  lines.push(`| Verantwortlich | ${meta.verantwortlich} |`)
  lines.push(`| Ziel-RTO | ${meta.rto} |`)
  lines.push(`| Ziel-RPO | ${meta.rpo} |`)
  lines.push('')
  lines.push('## 1. Zweck und Geltungsbereich')
  lines.push('')
  lines.push(
    `Dieses Konzept beschreibt die grundsätzliche Recovery-Fähigkeit der Infrastrukturkomponenten der Umgebung "${meta.projekt}" sowie die Auswirkungen eines Ausfalls und die Recovery-Methodik je Komponente. Es dient als technische Grundlage für den zugehörigen Disaster-Recovery-Plan (Management-Sicht).`
  )
  lines.push('')
  lines.push('## 2. Komponentenübersicht')
  lines.push('')
  lines.push('| Komponente | Recovery-Fähigkeit (Kurzfassung) | Produktdokumentation |')
  lines.push('|---|---|---|')
  for (const c of sel) {
    const kurz =
      c.konzept.faehigkeit.split('.')[0].replace(/^(.)/, (m) => m.toUpperCase()) +
      '.'
    lines.push(`| ${c.name} | ${kurz} | [Doku](${c.docs}) |`)
  }
  lines.push('')
  lines.push('## 3. Recovery-Fähigkeit, Ausfallauswirkungen und Methodik je Komponente')
  lines.push('')
  sel.forEach((c, i) => {
    lines.push(`### 3.${i + 1} ${c.name}`)
    lines.push('')
    lines.push(`**Recovery-Fähigkeit:** ${c.konzept.faehigkeit}`)
    lines.push('')
    lines.push(`**Auswirkungen eines Ausfalls:** ${c.konzept.auswirkung}`)
    lines.push('')
    lines.push(`**Recovery-Methodik:** ${c.konzept.methodik}`)
    lines.push('')
    lines.push(`**Produktdokumentation:** ${c.docs}`)
    lines.push('')
  })
  lines.push('## 4. Ziele (RTO / RPO)')
  lines.push('')
  lines.push(
    `Für die Gesamtumgebung werden eine Recovery Time Objective (RTO) von ${meta.rto} und ein Recovery Point Objective (RPO) von ${meta.rpo} angestrebt. Je Komponente können abweichende Werte in den jeweiligen Abschnitten 3.x dokumentiert sein.`
  )
  lines.push('')
  lines.push('## 5. Verweise')
  lines.push('')
  lines.push('- Zugehöriger DR-Plan (Management-Sicht): siehe separates Dokument.')
  lines.push('- Produktdokumentation der Hersteller: siehe Abschnitt 3 je Komponente.')
  lines.push('')
  return lines.join('\n')
}

export function generatePlan(meta, selectedIds) {
  const sel = selectedIds
    .map((id) => components.find((c) => c.id === id))
    .filter(Boolean)
  const lines = []
  lines.push(`# Disaster-Recovery-Plan: ${meta.projekt}`)
  lines.push('')
  lines.push(`| | |`)
  lines.push(`|---|---|`)
  lines.push(`| Dokument | DR-Plan (Management-Sicht) |`)
  lines.push(`| Projekt / Umgebung | ${meta.projekt} |`)
  lines.push(`| Stand | ${fmtDate(meta.stand)} |`)
  lines.push(`| Verantwortlich | ${meta.verantwortlich} |`)
  lines.push(`| Ziel-RTO | ${meta.rto} |`)
  lines.push(`| Ziel-RPO | ${meta.rpo} |`)
  lines.push('')
  lines.push('## 1. Zweck dieses Plans')
  lines.push('')
  lines.push(
    'Dieser Plan beschreibt die wesentlichen Wiederanlaufschritte je Infrastrukturkomponente in verständlicher, nicht-technischer Form. Er richtet sich an die verantwortliche Führungskraft, die den Wiederanlauf steuern und nachvollziehen kann, ohne selbst technische Details zu benötigen.'
  )
  lines.push('')
  lines.push('## 2. Eskalation und Kommunikation')
  lines.push('')
  lines.push('1. Ausfall bestätigen lassen (Monitoring-Alarm bzw. Nutzer-/Kundenmeldung).')
  lines.push('2. DR-Verantwortlichen informieren und Wiederanlauf-Entscheidung treffen.')
  lines.push('3. Stakeholder und Nutzer über Ersatz-Kommunikationskanal informieren.')
  lines.push('4. Wiederanlauf gemäß Abschnitt 3 priorisiert anweisen und überwachen.')
  lines.push('5. Nach Wiederanlauf: Normalbetrieb kommunizieren und Ausfall dokumentieren.')
  lines.push('')
  lines.push('## 3. Wiederanlaufschritte je Komponente')
  lines.push('')
  sel.forEach((c, i) => {
    lines.push(`### 3.${i + 1} ${c.name}`)
    lines.push('')
    lines.push(
      `**Worum es geht:** ${c.konzept.faehigkeit.split('.')[0]}. ${c.konzept.auswirkung.split(';')[0]}.`
    )
    lines.push('')
    lines.push('**Wesentliche Schritte:**')
    lines.push('')
    c.plan.schritte.forEach((s, j) => {
      lines.push(`${j + 1}. ${s}`)
    })
    lines.push('')
  })
  lines.push('## 4. Priorisierung')
  lines.push('')
  lines.push(
    'Wird die Wiederanlaufkapazität knapp, sind Komponenten in der Reihenfolge der Abschnitte 3.x zu bedienen – beginnend mit Datenbanken und Identity-Diensten (Voraussetzung für alle weiteren Systeme), gefolgt von Virtualisierungs-/Storage-Ebene, dann Anwendungs- und Integrationssystemen.'
  )
  lines.push('')
  lines.push('## 5. Wiederanlauf-Kriterien')
  lines.push('')
  lines.push(`- Der Wiederanlauf gilt als abgeschlossen, wenn die RTO (${meta.rto}) eingehalten wurde.`)
  lines.push(`- Der tolerierte Datenverlust darf das RPO (${meta.rpo}) nicht überschreiten.`)
  lines.push('- Alle kritischen Anwendungsfunktionen sind durch die Fachbereiche abgenommen.')
  lines.push('')
  return lines.join('\n')
}
