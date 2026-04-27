# AGENTS.md

Use this file as the entry point when you work on `snz-rodoved` without prior chat history.

Canonical facts live in `README.md` and `docs/*`. The `AGENTS/` folder is the live handoff layer:

- goals and rationale;
- active work;
- unfinished decisions;
- task-by-task continuation notes;
- rules for keeping context fresh.

## Required Read Order

1. [current-state.md](current-state.md)
2. [task-protocol.md](task-protocol.md)
3. [context/README.md](context/README.md)
4. [../README.md](../README.md)
5. [../docs/repo-map.md](../docs/repo-map.md)
6. Relevant files in [tasks](tasks)

## Working Rules

1. Do not rely on old chat context as the source of truth.
2. Read docs and AGENTS before non-trivial work.
3. Create or update a task file in `AGENTS/tasks/` when work spans modules or turns.
4. Update `AGENTS/context/*` when a design rationale changes.
5. Update `docs/*` when stable behavior changes.
6. Before handing off, write what changed, what was verified, and what remains.

Keep this file short and stable. Put volatile detail in `current-state.md` and `tasks/*`.
