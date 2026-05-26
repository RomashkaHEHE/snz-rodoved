# Task: Public Page And Assets

Status: WATCH
Priority: Medium

## Goal

Provide a public first screen at `/` without exposing survey data, and move customer images into a normal frontend asset location.

## Current Understanding

- Public statistics are intentionally out of scope for v1.
- Contacts should be active icon links rather than visible raw phone/email rows.
- Customer images are useful for brand direction but should remain easy to replace.
- Public descriptive copy remains short until exact VK/group wording is available.
- The public page must not show a work-zone button unless the user is already authenticated.
- The "guest entry" on `/` is a safe public-page jump, not access to private survey data.
- Current public accents use burgundy close to RGB(100, 0, 27).

## Relevant Files

- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `apps/web/public/images/brand/*`
- `apps/web/public/contacts/rodoved.vcf`
- `docs/assets.md`

## Next Steps

1. Replace the short public description when final VK/group copy is available.
2. Replace placeholder email in public contacts when the customer provides the real address.
3. Decide whether `background-example.jpg` should be used in a future design pass.

## Exit Criteria

- `/` renders a public project page.
- `/login`, `/editor`, and `/data` are the working routes.
- Root `images` folder is no longer used.
- Contact actions link to VK, Telegram, mailto placeholder, and a downloadable vCard.

## Handoff Notes

Completed in v1. Original image notes are preserved in `apps/web/public/images/brand/README.md`.
