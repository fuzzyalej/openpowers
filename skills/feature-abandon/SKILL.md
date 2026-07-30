---
name: feature-abandon
description: Abandon a change you have decided not to build — removes its worktree, branch, openspec change directory, and delivery tag after showing exactly what will be destroyed. Use via /openpowers:feature abandon <name>.
---

Abandon a change and clean up everything it created.

**Announce at start:** "I'm using the feature-abandon skill to clean up this change."

**Input:** A change name like `c0001-add-user-auth`. If not provided in `$ARGUMENTS`,
run `node "${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs"` and ask the user which change to
abandon.

Throughout this skill, `<change-name>` is a placeholder for that name — always
substitute the real value.

This skill destroys work. Every step below is written so nothing is deleted before the
user has seen exactly what would go.

---

## Step 0: Run from the main checkout

A worktree cannot remove itself, and the spec deletion in Step 6 belongs to the main
checkout. Verify where you are:

```bash
rtk git rev-parse --show-toplevel
```

If the path is inside `.worktrees/`, stop: "Run `/openpowers:feature abandon
<change-name>` from the main checkout, not from inside a worktree."

---

## Step 1: Inventory what exists

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
echo "base: $BASE"
test -d "openspec/changes/<change-name>" && echo "spec: openspec/changes/<change-name>" || echo "spec: none"
test -d ".worktrees/feature-<change-name>" && echo "worktree: .worktrees/feature-<change-name>" || echo "worktree: none"
rtk git rev-parse --verify --quiet "refs/heads/feature/<change-name>" >/dev/null && echo "branch: feature/<change-name>" || echo "branch: none"
rtk git rev-parse --verify --quiet "refs/tags/delivered/<change-name>" >/dev/null && echo "tag: delivered/<change-name>" || echo "tag: none"
test -d "openspec/changes/archive" && ls openspec/changes/archive | grep -- "<change-name>" || true
```

If **every** line reports `none`, stop: "Nothing found for `<change-name>`. Run
`/openpowers:feature` to see active changes."

If the change appears under `openspec/changes/archive/`, stop:
"`<change-name>` was already delivered and archived. Abandoning a delivered change would
rewrite shipped history — revert it with a normal change instead."

---

## Step 2: Report unmerged work

Commits on the branch that are not on the default branch are about to be destroyed, so
count and show them before asking anything:

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
rtk git log --oneline "$BASE..feature/<change-name>"
```

If the branch does not exist, skip this step.

---

## Step 3: Confirm

Show the user the full inventory and ask. Be specific — list the actual paths and refs
found in Step 1, not a generic description:

"Abandoning **<change-name>** will permanently delete:
- `openspec/changes/<change-name>/` (the spec — committed, so this is a deletion commit)
- `.worktrees/feature-<change-name>/` (working directory, including uncommitted changes)
- branch `feature/<change-name>` — **N unmerged commits will be lost**
- tag `delivered/<change-name>`

This cannot be undone. Type the change name to confirm."

Omit any line whose item does not exist. If there are unmerged commits, the count must
appear — the user needs to know work is being thrown away.

**Require the user to type `<change-name>` back.** Anything else — including "yes" —
aborts: "Not abandoned. Nothing was deleted."

---

## Step 4: Remove the worktree

```bash
rtk git worktree remove --force ".worktrees/feature-<change-name>"
```

`--force` is needed because the worktree usually has uncommitted changes. Skip if Step 1
found no worktree.

---

## Step 5: Delete the branch and tag

```bash
rtk git branch -D "feature/<change-name>"
rtk git tag -d "delivered/<change-name>"
```

Run only the commands for refs Step 1 actually found. `-D` (not `-d`) is required
because the branch is unmerged by definition.

If the branch or tag was pushed, tell the user — do not delete remote refs yourself:
"`feature/<change-name>` also exists on the remote. Delete it with
`git push origin --delete feature/<change-name>` if you want it gone there too."

---

## Step 6: Remove the openspec change

The spec is committed, so removing it is a commit of its own:

```bash
rtk git rm -r --quiet "openspec/changes/<change-name>"
rtk git commit -m "spec(<change-name>): abandon change"
```

Skip if Step 1 found no spec directory. If the directory exists but is untracked
(proposed but never committed), `rm -rf` it instead and make no commit.

---

## Step 7: Confirm

"**<change-name>** abandoned. Removed: <list what was actually deleted>.

Run `/openpowers:feature` to see remaining changes."
