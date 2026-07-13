# Product Intent

The project supports regular physical surveys for an older audience. Respondents fill paper forms, then one worker enters answers into the site and analyzes results.

The project now also supports a public online survey for people who can answer digitally. Online answers reuse the same question catalog so the operator can analyze them together with paper responses while filtering by source.

The first version must be useful enough for real data entry, but it is also a design макет for согласование. Avoid hard-coding design assumptions deep into backend/data code.

Public visitors should see a calm project page. Operator screens may contain advanced tools, but they must use progressive disclosure: the current task and primary action stay visible, while filters, test-data controls, privacy controls, and destructive actions appear only when the operator asks for them. Density is useful only when the visual hierarchy remains obvious.

The public online survey and the private workspace are separate product zones. They must not link to each other or share one navigation shell: `/` is only the respondent flow, while `/entry`, `/data`, and `/pdf` are only the operator workspace. Direct URLs and browser controls remain the boundary between them.

The online survey should preserve the paper questionnaire's sequence through Q16. Digital-only follow-up fields are not an independent opening section: name, phone, research territory, period, and free text belong to a request for help and appear only when Q16 is answered `yes`. If that answer changes, hidden dependent values must be cleared rather than retained invisibly.

Desktop and phone layouts may use different controls for the same state. For example, desktop data modes use tabs while phone layouts use one select. This is intentional when it keeps every option reachable without creating a wall of buttons.

Paper entry follows the same device-specific rule. Desktop keeps the whole questionnaire visible for overview and keyboard work; phone layouts guide the operator through demographics and one question at a time. A mobile answer may advance immediately when no dependent field is required, while Q11 and Q16 remain in place for their conditional details.

Data-row selection follows that rule too. A desktop has room for a list and sticky inspector side by side; a phone must treat the selected questionnaire as a separate focused screen. Returning from that screen must preserve the list and its scroll position. Optional detail such as the complete Q4-Q16 audit stays collapsed until the operator asks for it, while contact privacy remains explicit.

The operator also needs a small private catalog of scanned paper questionnaires. This is archival storage for source documents, not a replacement for structured data entry.

Customer suggestions such as map selection and timeline sliders should be treated as product inspiration, not literal technical requirements. Prefer accessible, maintainable controls first; integrate heavy map/timeline services only after there is a concrete workflow and API-key/deployment decision.
