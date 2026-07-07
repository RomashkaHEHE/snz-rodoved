# Task: Responsive Workspace

Status: DONE
Priority: High

## Goal

Make the working pages comfortable on both laptops and small phones, especially iPhone 12 mini in Safari/Yandex Browser.

## Current Understanding

- The operator often works from a phone.
- Data-entry controls must not drift or wrap unpredictably.
- Mobile should use different control ergonomics, not just a narrower desktop layout.
- Important mobile patterns: bottom workspace navigation, large tap targets, stable answer button grids, readable data rows, and a save action that remains reachable.

## Relevant Files

- `apps/web/src/App.tsx`
- `apps/web/src/components/ResponseForm.tsx`
- `apps/web/src/components/SegmentedControl.tsx`
- `apps/web/src/components/ResponsesTable.tsx`
- `apps/web/src/styles.css`

## Next Steps

1. Update workspace navigation and form actions for mobile ergonomics.
2. Make segmented controls stable on narrow screens.
3. Render data rows as cards on mobile instead of a wide table.
4. Verify desktop and iPhone-width layouts.

## Exit Criteria

- `/editor`, `/data`, and `/pdf` remain usable at laptop widths.
- `/editor` controls fit and keep predictable positions on ~360-390px mobile widths.
- `/data` table rows become readable mobile cards.
- Verification commands and visual checks are recorded.

## Handoff Notes

Implemented 2026-07-08 after customer noted regular iPhone 12 mini usage.

Changed:

- workspace navigation becomes a fixed bottom nav on phone widths;
- `/editor` answer buttons use stable mobile grids;
- `/editor` save action is sticky above the bottom nav;
- `/data` action buttons become full-width mobile buttons;
- `/data` response table becomes labeled cards on mobile.

Verified:

- `npm run typecheck`
- `npm run lint`
- Browser smoke at 375x812: `/editor` and `/data` had no horizontal overflow; answer buttons were equal-width; mobile table rows rendered as cards.
