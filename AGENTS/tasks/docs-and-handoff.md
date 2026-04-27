# Task: Docs And Handoff Layer

Status: DONE
Priority: High

## Goal

Create factual docs and a separate AGENTS layer so future work can start without chat history.

## Current Understanding

- `docs/*` should describe what exists and how it works.
- `AGENTS/*` should explain why decisions exist and what future agents should know.
- Task files should be updated after substantial work.

## Relevant Files

- `docs/*`
- `AGENTS/AGENTS.md`
- `AGENTS/current-state.md`
- `AGENTS/context/*`
- `AGENTS/tasks/*`

## Next Steps

1. Keep docs updated when behavior changes.
2. Keep AGENTS updated when rationale, priorities, or active tasks change.

## Exit Criteria

- New engineer/agent can find setup, API, data model, deployment, assets, and repo map.
- AGENTS read order and task protocol are documented.

## Handoff Notes

Completed in v1. Structure is inspired by the Rolay-plugin handoff layer but adapted to this project.
