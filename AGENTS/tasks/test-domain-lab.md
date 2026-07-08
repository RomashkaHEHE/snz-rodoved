# Test Domain Product Lab

## Status

ACTIVE

## Priority

High

## Goal

Use `test.snz-rodoved.ru` as a separate experimental product, not as a staging copy of `snz-rodoved.ru`.

The goal is to discover a better Rodoved workflow from a clean slate:

- online survey that feels natural for visitors instead of mirroring the paper form;
- operator interface that works well on iPhone-sized screens and laptops;
- data workspace where rows, filters, PDF files, charts, and exports are organized around real tasks;
- safer handling of contact data and paper scans;
- product decisions that can later be ported into production deliberately.

## Context From User

- Production is the stable working version.
- Test is a different site for solving the same tasks with different interface decisions.
- Test should not share the old production UI.
- The branches should not be treated as a simple staging-to-main pipeline.
- Stable urgent fixes, like q16 name/phone fields, belong in `main` first.

## Current Implementation

- `apps/web/src/App.tsx` now renders only the experimental app.
- Experimental UI lives under `apps/web/src/experiment`.
- Old production routes are not exposed from the test entrypoint.
- The first test screen is a clean product-lab shell that states the intended directions without pretending the new workflows already exist.

## Working Rules

- Do not merge `test` wholesale into `main`.
- Do not implement production hotfixes only in `test`.
- When an experiment is approved, port the idea into `main` as a focused production change.
- Keep test data isolated from production data.
- Prefer new test-specific components under `apps/web/src/experiment` until a stable production decision exists.

## Next Experiments

1. Public online survey prototype:
   - fewer dense question rows;
   - grouped sections;
   - contact request only when help is needed;
   - clear mobile-first flow.
2. Operator mobile entry prototype:
   - thumb-friendly answer controls;
   - sticky progress/save controls;
   - fast correction of one row.
3. Data workspace prototype:
   - table-first work with inline row details;
   - PDFs surfaced by selected date range;
   - analytics below the operational data instead of dominating the page.

## Exit Criteria For This Reset

- `test.snz-rodoved.ru` no longer renders the production interface.
- `main` contains the required q16 name/phone production feature.
- Documentation clearly states that test is a product lab, not staging.
