# DR-Template-Generator

React-App zur Erstellung von **Disaster-Recovery-Konzepten** und **Disaster-Recovery-Plänen** auf Basis der verwendeten Infrastrukturkomponenten.

## Funktionsweise

1. **Umgebung erfassen** – Projekt, Verantwortlicher, Stand, Ziel-RTO und Ziel-RPO.
2. **Komponenten auswählen** – per Dropdown, gruppiert nach Kategorien (Datenbanken, Web-/App-Server, Load Balancer, Storage/Backup, Virtualisierung/Cloud, Messaging, Identity, Betrieb).
3. **Dokumente generieren** – live im Browser, als Markdown exportierbar:
   - **DR-Konzept (technisch)**: generelle Recovery-Fähigkeit je Komponente, Ausfallauswirkungen, Recovery-Methodik (z. B. automatischer Failover oder manueller Restore) sowie Verweise auf die offizielle Produktdokumentation.
   - **DR-Plan (Management-Sicht)**: wesentliche Wiederanlaufschritte je Komponente in nicht-technischer Form, inkl. Eskalations-, Priorisierungs- und Abnahmekriterien.

Das Komponentenwissen (`src/data/catalog.js`) basiert auf den öffentlich verfügbaren Produktdokumentationen der Hersteller (Microsoft Learn, AWS Docs, VMware Docs, PostgreSQL/MySQL/Kafka-Docs usw.) und kann dort erweitert werden.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
npm run lint     # Linting
```

## KI-Discovery für eigene Komponenten

Eigene Komponenten können automatisch befüllt werden: Name und Kategorie eintragen, „Automatisch füllen (KI)“ klicken – ein KI-Modell (Mistral) generiert Recovery-Fähigkeit, Ausfallauswirkungen, Recovery-Methodik, DR-Plan-Schritte und Doku-URL im Stil des eingebauten Katalogs. Die Felder bleiben vor dem Speichern editierbar.

Dafür ist ein eigener Mistral-API-Schlüssel nötig (kostenlos erstellbar unter [console.mistral.ai](https://console.mistral.ai/api-keys)). Der Schlüssel wird ausschließlich lokal im Browser (localStorage) gehalten und direkt an `api.mistral.ai` gesendet – er landet weder im Code noch im Repository.

## Dauerhafte Speicherung eigener Komponenten

Eigene Komponenten werden immer lokal im Browser (localStorage) gespeichert. Für echte Persistenz über Browser und Geräte hinweg legen sie die Komponenten zusätzlich in der Datei `custom-components.json` auf dem `main`-Branch des Repositories ab:

- Dafür einmalig einen GitHub-Token hinterlegen (Abschnitt „KI-Discovery“): ein fein abgestimmter Token (fine-grained) mit **Contents: Read and write** für dieses Repository, erstellbar unter [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens/new).
- Jedes Speichern/Bearbeiten/Löschen einer eigenen Komponente schreibt dann die vollständige Liste ins Repository (mit Versionshistorie); der Token bleibt nur lokal im Browser.
- Beim App-Start werden Komponenten aus dem Repository automatisch geladen und mit den lokalen zusammengeführt – so stehen sie dauerhaft und auch für Kollegen zur Verfügung.

## Audit-Trail und editierbare Dokumente

- **Audit-Trail** (unter der Dokumentvorschau, aufklappbar): jede Änderung wird mit Autor, Datum/Zeitstempel und Versionsnummer festgehalten, getrennt nach Komponenten-Änderungen, DR-Konzept-Änderungen und DR-Plan-Änderungen. Der Autor wird einmalig in den Einstellungen hinterlegt. Mit GitHub-Token wird der Audit-Trail dauerhaft in `audit-trail.json` im Repository gespeichert.
- **DR-Konzept und DR-Plan sind als Ganzes editierbar**: Button „Ganzes Dokument bearbeiten“ öffnet den Markdown-Editor mit dem aktuellen Stand; die gespeicherte Fassung ersetzt die Generierung (inkl. Download), bis sie über „Generierte Fassung wiederherstellen“ zurückgesetzt wird. Bearbeitete Dokumente werden mit GitHub-Token in `documents.json` im Repository persistiert.
