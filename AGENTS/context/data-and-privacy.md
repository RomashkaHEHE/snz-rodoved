# Data And Privacy

V1 structured paper entry does not collect respondent names, phone numbers, addresses, or free personal notes.

The public online survey has a free-text field because the customer needs search context. UI copy should avoid asking for contacts; treat this field as search notes, not a personal-data collection channel.

Survey answer rules:

- answer fields are `yes`, `no`, or `unknown`;
- `unknown` means blank, unclear, or not entered from the paper form;
- q11 has an optional short text field for the war detail;
- q7 and q8 are separate by source-paper design.
- responses have `source=paper` or `source=online`;
- online responses may have territory, period, and free-text search context.

Public statistics are intentionally absent in v1. Adding them later requires a new privacy/product decision.

## PDF archive

Uploaded PDFs are scans of handwritten paper questionnaires for a whole survey day. Some paper forms may include respondent contact data even though structured fields deliberately do not.

Privacy rules:

- PDF files are protected workspace data, not public assets.
- PDF downloads go through authenticated API routes.
- The PDF archive is independent from `responses`; deleting a PDF must not delete entered questionnaire rows.
- File date is derived from the operator-provided name `YYYYMMDD_анкеты.pdf`, because one file represents one survey day.
