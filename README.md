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
