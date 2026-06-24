---
name: feature-status
description: Show the status of all active openpowers changes — openspec list output enriched with worktree and branch state, blocked indicators, and next-action hints per change. Use via /feature with no arguments.
---

Show the current state of all active features.

**Announce at start:** "I'm using the feature-status skill to show active changes."

---

## Step 1: List active changes

```bash
openspec list
```

If the output is empty, tell the user:
"No active changes. Use `/feature \"describe what you want to build\"` to start one."
Then stop.

---

## Step 2: Gather worktree and branch state

Run once to get all worktree paths:

```bash
rtk git worktree list --porcelain
```

From the output, identify which changes have a worktree at `.worktrees/feature-<change-name>`.

For changes with a worktree, gather commits-ahead counts in a single pass:

```bash
for wt in .worktrees/feature-*/; do
  name=$(basename "$wt" | sed 's/^feature-//')
  count=$(git -C "$wt" log --oneline main..HEAD 2>/dev/null | wc -l | tr -d ' ')
  echo "$name $count"
done
```

Build a map of `change-name → commits-ahead` from the output. Do not run a separate subprocess per change.

---

## Step 3: Display enriched status table

Print a table with one row per change:

| Change | Worktree | Commits ahead | Next action |
|---|---|---|---|
| `0001-add-auth` | active | 4 | `/feature deliver 0001-add-auth` |
| `0002-add-export` | none | — | `/feature implement 0002-add-export` |

**Next action logic:**
- No worktree, `tasks.md` absent → `/feature propose <change-name>` (spec incomplete)
- No worktree, `tasks.md` present → `/feature implement <change-name>`
- Worktree exists, commits ahead > 0 → `/feature deliver <change-name>`
- Worktree exists, commits ahead = 0, unchecked tasks remain in `tasks.md` → implementation not started; `/feature implement <change-name>`
- Worktree exists, commits ahead = 0, all tasks checked → branch may be behind main or commits were squashed; check with `git log main..HEAD` in the worktree

---

## Step 4: Show hint

"Use `/feature \"description\"` to start a new feature."
