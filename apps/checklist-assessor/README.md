# Checklist Assessor

Standalone React/Vite app for importing assessment checklists and reviewing artifacts. The app is separate from the repository's DR template generator.

## Run locally

```sh
cd apps/checklist-assessor
npm install
npm run dev
```

## Checklist formats

- Excel/CSV: the first worksheet is read; recognized columns include `criterion` (or `name`/`item`), `requirement` (or `description`), `evidence` (or `evidence required`), and `weight` (or `points`).
- OSCAL JSON, XML, and YAML: imports Catalog controls with their statement text and guidance. Profile and Assessment Plan files import explicit control-ID references; because those models point to controls rather than carrying the full catalog statements, import the source Catalog to get complete control text.

The OSCAL importer is a checklist adapter, not a full OSCAL validator or profile resolver. It does not resolve remote/local profile imports or validate documents against the official OSCAL schemas.

## Artifact formats

Text, Markdown, CSV, JSON, XML, YAML, DOCX, PDF, and common image formats are supported for browser-side text extraction where possible. Image OCR currently uses English.
