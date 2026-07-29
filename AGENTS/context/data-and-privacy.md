# Data And Privacy

V1 structured paper entry does not collect respondent names, phone numbers, addresses, or free personal notes.

The public online survey has a free-text field because the customer needs search context. UI copy should avoid asking for contacts in that field; treat it as search notes, not a personal-data collection channel.

When the online respondent answers `yes` to q16 ("need help"), the form asks for name and phone. These are personal contact fields and must remain available only to the workspace/admin flow, CSV export, and protected API responses.

The workspace response table masks contact names and phones by default. This is a
display safeguard, not an API boundary: editing and an explicit reveal still use
the protected response payload.

The default CSV export omits the contact columns on the server. A separately
named `includeContacts=true` export requires an explicit confirmed workspace
action. Do not call the default file anonymous because territory and free text may
still identify a person.

Public phone input accepts familiar punctuation but requires 10-15 digits.
Public online submission requires `consentToDataProcessing=true`; historical and
paper rows may store `NULL` when no mark was recorded. The current consent copy is
a product safeguard, not a claim that final legal policy text has been approved.

Survey answer rules:

- answer fields are `yes`, `no`, or `unknown`;
- `unknown` means blank, unclear, or not entered from the paper form;
- q11 has an optional short text field for the war detail;
- q7 and q8 are separate by source-paper design.
- responses have `source=paper` or `source=online`;
- online responses may have territory, period, and free-text search context.
- online responses may have `contactName` and `contactPhone` when q16 is `yes`.

Public statistics are intentionally absent in v1. Adding them later requires a new privacy/product decision.

## Questionnaire deletion

Ordinary deletion is recoverable. It sets `deleted_at`; the repository excludes
deleted rows from active lists, filters, analytics, and CSV, and rejects updates
until the row is restored.

Fake-only cleanup is the only permanent response deletion. Its database predicate
must remain `is_fake=true` and must be tested against both active and trashed real
rows.

## PDF archive

Uploaded PDFs are scans of handwritten paper questionnaires for a whole survey day. Some paper forms may include respondent contact data even though structured fields deliberately do not.

Privacy rules:

- PDF files are protected workspace data, not public assets.
- PDF downloads go through authenticated API routes.
- The PDF archive is independent from `responses`; deleting a PDF must not delete entered questionnaire rows.
- File date is derived from the operator-provided name `YYYYMMDD_анкеты.pdf`, because one file represents one survey day.
