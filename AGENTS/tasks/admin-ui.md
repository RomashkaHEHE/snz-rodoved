# Task: Admin UI

Status: WATCH
Priority: High

## Goal

Give the operator a readable working surface for entering paper surveys, filtering responses, editing mistakes, and reviewing charts.

## Current Understanding

- The operator is likely doing repetitive manual entry.
- Controls should be large, predictable, and keyboard-friendly.
- Visual design should be calm and easy to change later.
- Public, password login, admin login, editor, and data work are now separate routes.
- `/admin` manages the admin password and the workspace password. The API applies changes immediately and persists them to production `.env`.
- `/data` auto-refreshes when filters change, when the tab regains focus, and every 30 seconds; there is no manual refresh button.
- `/data` includes fake-response controls: one click creates one visibly marked fake row, and bulk deletion calls the fake-only endpoint.

## Relevant Files

- `apps/web/src/App.tsx`
- `apps/web/src/components/ResponseForm.tsx`
- `apps/web/src/components/FilterPanel.tsx`
- `apps/web/src/components/Dashboard.tsx`
- `apps/web/src/components/ResponsesTable.tsx`

## Next Steps

1. Review the revised `/`, `/login`, `/admin`, `/editor`, and `/data` screens with the customer.
2. Add shortcuts or duplicate-last-response behavior only after observing real entry flow.
3. Consider import after CSV export is validated.

## Exit Criteria

- `/login` appears for unauthenticated editor/data access and asks only for a password.
- `/admin` uses username and password, then can update both passwords.
- Operator can create on `/editor`, then edit/delete/filter/analyze/export on `/data`.
- Fake rows are marked in the table so test data does not blend into real survey data.
- UI remains usable on desktop and narrow screens.

## Handoff Notes

V1 route split completed after customer review comments. The form defaults to today, `female`, `over_40`, `snezhinsk`, and `unknown` answers to reduce clicks; revisit defaults if they cause entry mistakes.
