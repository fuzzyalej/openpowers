---
name: feature-status
description: Show the status of all active openpowers changes — openspec list output enriched with worktree and branch state, task progress, and next-action hints per change. Use via /openpowers:feature with no arguments.
---

Show the current state of all active features.

**Announce at start:** "I'm using the feature-status skill to show active changes."

---

## Step 1: Render the status table

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs"
```

The script owns all of it — the openspec change list, worktree detection, commits
ahead of the repo's default branch, `tasks.md` progress, and the next-action hint
per change. Do **not** re-derive any column by hand or run supplementary git
commands; every input is deterministic and the script has already read them.

If the output is `NO_CHANGES`, tell the user:
"No active changes. Use `/openpowers:feature \"describe what you want to build\"` to start one."
Then stop.

Otherwise print the table exactly as emitted.

---

## Step 2: Show hint

"Use `/openpowers:feature \"description\"` to start a new feature."

---

## Reference: how the script decides "Next action"

You do not need to apply these rules — they are documented so the output can be
explained if the user asks.

| State | Condition | Next action |
|---|---|---|
| spec incomplete | no `tasks.md`, or it has no checkboxes | `propose` |
| not started | tasks exist, no worktree — or a worktree with zero tasks ticked | `implement` |
| in progress | worktree exists, some tasks ticked, some open | `implement` (resumes) |
| ready | worktree exists, all tasks ticked, commits ahead > 0 | `deliver` |
| check | all tasks ticked but no commits ahead | inspect the worktree manually |
