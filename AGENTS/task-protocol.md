# Task Protocol

Create or update a task file in `AGENTS/tasks/` when work is:

- expected to span more than one turn;
- touching multiple modules;
- subtle enough that future agents may repeat discovery;
- blocked by product decisions or deployment constraints.

## Required Sections

Every task file should include:

- `Status`
- `Priority`
- `Goal`
- `Current understanding`
- `Relevant files`
- `Next steps`
- `Exit criteria`

## Status Values

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`
- `WATCH`

## End-of-Turn Hygiene

Update the relevant task file with:

- changed files;
- verified commands;
- unverified risk;
- exact next action.

If stable behavior changed, update `docs/*`. If rationale changed, update `AGENTS/context/*`.
