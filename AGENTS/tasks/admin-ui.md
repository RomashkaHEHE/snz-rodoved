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
- `/admin` uses username and password.
- Operator can create on `/editor`, then edit/delete/filter/analyze/export on `/data`.
- UI remains usable on desktop and narrow screens.

## Handoff Notes

V1 route split completed after customer review comments. The form defaults to today, `female`, `over_40`, `snezhinsk`, and `unknown` answers to reduce clicks; revisit defaults if they cause entry mistakes.
