# Data And Privacy

Structured rows may contain a respondent name and phone only in the Q16 help branch. Public online help requests require both fields; paper entry permits them to be absent when the handwritten form has no contact.

The public online survey has a free-text field because the customer needs search context. UI copy should avoid asking for contacts in that field; treat it as search notes, not a personal-data collection channel.

When the online respondent answers `yes` to q16 ("need help"), the form asks for name and phone. These are personal contact fields and must remain available only to the workspace/admin flow, CSV export, and protected API responses.

CSV export must require a deliberate choice before including `contactName` or `contactPhone`. The default protected export omits both columns at the server, regardless of the browser's local contact-visibility state. `includeContacts=true` is reserved for the separately named and confirmed workspace action. Do not call the default file anonymous: territory, free text, and workflow notes may still identify a person.

The public form accepts familiar phone punctuation but requires 10-15 digits. This is a data-quality rule, not phone ownership verification.

Consent fields are nullable booleans. `undefined`/database `NULL` means that no mark was recorded and must be displayed/exported as `Не зафиксировано`, never silently converted to `Нет`. Public online submission requires `consentToDataProcessing=true`; invitation consent is an independent optional answer from the original paper form and must not be cleared when Q16 changes. These controls record the respondent's choice but do not by themselves claim legal compliance; final legal text and policy links require customer/legal review.

The test-domain browser draft may persist non-contact answers for at most 24 hours. It must remove `contactName` and `contactPhone` before every localStorage write and must not restore contact values left by an older client version. If q16 is `yes`, a restored draft returns to the dedicated contact step and asks for both values again before the optional search-context step.

The test-domain paper-entry draft is tab-scoped and may persist for at most 24 hours. It stores only the survey date, demographics, Q4-Q16 answers, Q11 war detail, consent marks, and the current mobile step. It must never store contact fields, search context, free text, or internal contact-workflow fields. A restored Q16 help request keeps the answer but asks the operator to enter name and phone again. Successful row creation and explicit series completion remove the draft immediately.

The test-domain online survey must not reuse paper-entry demographic defaults as implicit public answers. Gender, age group, and residence are stored only after the visitor deliberately selects each control.

Survey answer rules:

- answer fields are `yes`, `no`, or `unknown`;
- `unknown` means blank, unclear, or not entered from the paper form;
- q11 has an optional short text field for the war detail;
- q7 and q8 are separate by source-paper design.
- responses have `source=paper` or `source=online`;
- online responses may have territory, period, and free-text search context.
- online responses may have `contactName` and `contactPhone` when q16 is `yes`.
- workspace contact workflow may add `contactStatus`, `contactNextDate`, and `contactNote`; these are internal operator fields and must not be shown publicly.

Public statistics are intentionally absent in v1. Adding them later requires a new privacy/product decision.

## Questionnaire deletion

An operator's ordinary delete action is recoverable. It sets `deleted_at` and removes the row from active lists, filters, contact queues, charts, analytics, and CSV without destroying the questionnaire. The protected trash view may restore the same row and has no permanent-delete action for real data.

Bulk demo cleanup is the only questionnaire path that physically removes rows. Its repository predicate must remain `is_fake=true` and must be tested against both active and trashed real rows; UI wording or trash state must never be used as the safety boundary.

## PDF archive

Uploaded PDFs are scans of handwritten paper questionnaires for a whole survey day. Some paper forms may include respondent contact data even though structured fields deliberately do not.

Privacy rules:

- PDF files are protected workspace data, not public assets.
- PDF downloads go through authenticated API routes.
- The PDF archive is independent from `responses`; deleting a PDF must not delete entered questionnaire rows.
- File date is derived from the operator-provided name `YYYYMMDD_анкеты.pdf`, because one file represents one survey day.
- On the test domain, the UI derives that name from the chosen survey date and keeps a selected file only in memory until the operator explicitly confirms upload.
- A second file for the same survey date is blocked; existing scans are never replaced silently.
- The archive UI requires a second explicit confirmation before deletion and names the consequence before calling the delete API.
