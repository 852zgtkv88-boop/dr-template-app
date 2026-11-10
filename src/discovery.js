const MODEL = 'mistral-small-latest'

const API_URL = 'https://api.mistral.ai/v1/chat/completions'

function buildPrompt(name, categoryLabel) {
  return `Du bist ein Experte für Disaster Recovery und IT-Infrastruktur. Erstelle strukturiertes DR-Wissen für die folgende Infrastrukturkomponente, basierend auf dem, was in der öffentlich verfügbaren Produktdokumentation des Herstellers dokumentiert ist.

Komponente: ${name}
Kategorie: ${categoryLabel}

Erzeuge folgende Felder auf Deutsch:
- "faehigkeit": 2-3 Sätze zur generellen Recovery-Fähigkeit der Komponente (z. B. Hochverfügbarkeits-Features, Replikations-/Failover-Mechanismen, Backup-Integration). Nenne konkrete Produktnamen der Mechanismen.
- "auswirkung": 2-3 Sätze zu den Auswirkungen eines Ausfalls (welche Prozesse/Nutzer sind betroffen, wie viel Datenverlust ist realistisch je Konfiguration).
- "methodik": 1-2 Sätze zur Recovery-Methodik, typischerweise automatischer Failover oder manueller Restore mit kurzem Warum.
- "schritte": Array mit genau 4 nicht-technischen Wiederanlaufschritten für einen Manager, der den Wiederanlauf steuert, aber keine technischen Details benötigt. Jeder Schritt ein vollständiger Satz, im Stil "Prüfen lassen..."/"Bestätigen lassen...". Keine Befehle, keine Tool-Namen.
- "docs": die beste offizielle URL der Produktdokumentation des Herstellers (nur eine URL, ohne Erklärung).
- "confidence": eine ganze Zahl von 0 bis 100, die angibt, wie zuverlässig deine Angaben für genau dieses Produkt sind (100 = sehr sicher, Produkt und seine DR-Mechanismen sind dir gut bekannt; 50 = überwiegend auf allgemeines Kategoriewissen gestützt; unter 30 = Produkt praktisch unbekannt).
- "begruendung": ein kurzer Satz, der die Confidence-Zahl erklärt (z. B. "Produktmechanismen gut dokumentiert" oder "Angaben auf Kategorieüblichkeiten gestützt, Produkt nicht eindeutig identifiziert").

Antworte ausschließlich als JSON-Objekt mit genau diesen Schlüsseln. Wenn du die Komponente nicht kennst, gib dein bestes Wissen über das produktkategorie-übliche Verhalten an und verwende keine erfundenen Produktnamen.`
}

export async function discoverComponent(name, categoryLabel, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: buildPrompt(name, categoryLabel),
        },
      ],
    }),
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'API-Schlüssel wurde abgelehnt (401/403). Bitte Schlüssel prüfen.'
      )
    }
    if (response.status === 429) {
      throw new Error('Rate-Limit erreicht (429). Bitte kurz später erneut versuchen.')
    }
    throw new Error(`API-Fehler (HTTP ${response.status}).`)
  }

  const data = await response.json()
  let payload
  try {
    payload = JSON.parse(data.choices[0].message.content)
  } catch {
    throw new Error('Die Antwort des Modells war kein gültiges JSON.')
  }

  const schritte = Array.isArray(payload.schritte)
    ? payload.schritte.filter((s) => typeof s === 'string' && s.trim())
    : []

  let confidence = Number(payload.confidence)
  if (!Number.isFinite(confidence)) confidence = 50
  confidence = Math.max(0, Math.min(100, Math.round(confidence)))

  return {
    faehigkeit: typeof payload.faehigkeit === 'string' ? payload.faehigkeit.trim() : '',
    auswirkung: typeof payload.auswirkung === 'string' ? payload.auswirkung.trim() : '',
    methodik: typeof payload.methodik === 'string' ? payload.methodik.trim() : '',
    schritte,
    docs: typeof payload.docs === 'string' ? payload.docs.trim() : '',
    confidence,
    begruendung:
      typeof payload.begruendung === 'string' ? payload.begruendung.trim() : '',
  }
}
