# Task: PDF Archive

Status: DONE
Priority: High

## Goal

Add protected storage for PDF scans of handwritten questionnaires. One PDF represents all paper questionnaires from one survey day.

## Current Understanding

- Customer uploads about one PDF per month.
- Operator manually names each file as `YYYYMMDD_анкеты.pdf`.
- The app derives the survey date from that name and filters PDFs by `dateFrom`/`dateTo`.
- PDFs can contain contact data written on paper, so they must stay behind workspace auth.
- PDF archive is separate from structured questionnaire rows. Deleting a PDF must not affect `responses`.
- `/data` shows matching PDFs above analytics results.
- Charts are collapsed by default under a "Графики и срезы" details block.
- `/pdf` is the management page for upload, list, download, and delete.

## Relevant Files

- `packages/shared/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/repository.ts`
- `packages/db/src/migrate.ts`
- `packages/db/migrations/0003_survey_pdf_files.sql`
- `apps/api/src/app.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/api/client.ts`
- `apps/web/src/components/PdfArchive.tsx`
- `apps/web/src/styles.css`
- `docs/api.md`
- `docs/data-model.md`
- `docs/deployment-backup.md`

## Next Steps

1. Replace manual download-only behavior if the customer asks for in-browser PDF preview or print.
2. Add a backup script for `RODOVED_PDF_DIR` if operational backups need to be automated beyond documentation.

## Exit Criteria

- Workspace-authenticated user can upload one PDF with a valid `YYYYMMDD_анкеты.pdf` display name.
- `/data` lists PDFs matching current date filters above collapsed analytics.
- `/pdf` lists all PDFs sorted newest first and supports download/delete.
- Tests cover shared filename parsing, DB repository filtering, and API upload/list/download/delete.

## Handoff Notes

Implemented on 2026-07-08. Verification run: `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`.
