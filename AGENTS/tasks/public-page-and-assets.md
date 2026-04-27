# Task: Public Page And Assets

Status: DONE
Priority: Medium

## Goal

Provide a public first screen at `/` without exposing survey data, and move customer images into a normal frontend asset location.

## Current Understanding

- Public statistics are intentionally out of scope for v1.
- Contact text is placeholder copy until the customer provides final wording.
- Customer images are useful for brand direction but should remain easy to replace.
- Public descriptive copy is placeholder-only until project wording is provided.
- The public page must not show a work-zone button unless the user is already authenticated.

## Relevant Files

- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `apps/web/public/images/brand/*`
- `docs/assets.md`

## Next Steps

1. Replace placeholder contact text and project description when final copy is available.
2. Decide whether `background-example.jpg` should be used in a future design pass.

## Exit Criteria

- `/` renders a public project page.
- `/login`, `/editor`, and `/data` are the working routes.
- Root `images` folder is no longer used.

## Handoff Notes

Completed in v1. Original image notes are preserved in `apps/web/public/images/brand/README.md`.
