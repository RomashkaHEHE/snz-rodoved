# Product Intent

The project supports regular physical surveys for an older audience. Respondents fill paper forms, then one worker enters answers into the site and analyzes results.

The project now also supports a public online survey for people who can answer digitally. Online answers reuse the same question catalog so the operator can analyze them together with paper responses while filtering by source.

The first version must be useful enough for real data entry, but it is also a design макет for согласование. Avoid hard-coding design assumptions deep into backend/data code.

Public visitors should see a calm project page. Operator screens may contain advanced tools, but they must use progressive disclosure: the current task and primary action stay visible, while filters, test-data controls, privacy controls, and destructive actions appear only when the operator asks for them. Density is useful only when the visual hierarchy remains obvious.

Desktop and phone layouts may use different controls for the same state. For example, desktop data modes use tabs while phone layouts use one select. This is intentional when it keeps every option reachable without creating a wall of buttons.

The operator also needs a small private catalog of scanned paper questionnaires. This is archival storage for source documents, not a replacement for structured data entry.

Customer suggestions such as map selection and timeline sliders should be treated as product inspiration, not literal technical requirements. Prefer accessible, maintainable controls first; integrate heavy map/timeline services only after there is a concrete workflow and API-key/deployment decision.
