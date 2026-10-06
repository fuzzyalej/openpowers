---
name: feature-deliver
description: Run the delivery sequence for a completed feature — verify tasks, documentation gate, code review, clean branch history, then archive, tag, and land. Use via /openpowers:feature deliver <name> or called from feature-implement after all tasks are green.
---

Complete the delivery sequence for a feature whose implementation is done and tests are green.

**Announce at start:** "I'm using the feature-deliver skill to deliver this feature."

**Input:** A change name like `c0001-add-user-auth`. If not provided in `$ARGUMENTS`, run `openspec list` and ask the user to select.

Throughout this skill, `<change-name>` is a placeholder for that name — always substitute the real value.

---

## Step 0: Resolve the default branch

Delivery compares this branch against the repo's integration branch, which is not
always `main`. Resolve it once and reuse it everywhere below as `$BASE`:

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs") && echo "$BASE"
```

Every later command in this skill that references `$BASE` must run in the same shell
invocation as its own `BASE=$(...)` assignment, or substitute the resolved value
literally. Never hardcode `main`.

---

## Step 1: Confirm readiness

Run the cheap checks together:

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
test -f guidelines.md && echo "guidelines: ok" || echo "guidelines: MISSING"
test -f "openspec/changes/<change-name>/tasks.md" && echo "tasks: ok" || echo "tasks: MISSING"
git log --oneline "$BASE"..HEAD | wc -l
```

- `guidelines: MISSING` → stop: "guidelines.md is missing. Run `/openpowers:feature init` to set up the project before delivering."
- `tasks: MISSING` → stop: "No tasks.md for <change-name>. Run `/openpowers:feature propose <change-name>` first."

**Tests.** If `feature-implement` invoked this skill in the current session and reported
tests green, say "Tests verified green during implementation — skipping the redundant
run." and continue. Otherwise read the test command from `guidelines.md` and run it. If
tests fail, stop: "Tests must be green before delivery. Fix the failures and re-run
`/openpowers:feature deliver <change-name>`."

---

## Step 2: Verify every task is complete

`feature-implement` ticks each task in the same commit as the work it describes, so
`tasks.md` already reflects reality. This step **verifies** that record — it does not
rewrite it.

```bash
grep -c '^\s*-\s*\[ \]' "openspec/changes/<change-name>/tasks.md" || true
```

If the count is zero, continue.

If any task is still unticked, list those lines and stop:

"<change-name> has N unfinished tasks. Delivery marks a feature as shipped, so every
task must be done first. Run `/openpowers:feature implement <change-name>` to resume,
or remove the tasks you have decided not to do."

Do **not** bulk-flip the boxes to make this check pass — that would assert completion
rather than confirm it. If the record is wrong because a task was genuinely finished
without being ticked, tick that one line and commit it with an explanation.

---

## Step 3: Documentation gate

Ask:
"Does this feature require updating any committed documentation?
- New CLI commands or flags → `docs/cli/`
- Architecture decisions (ADRs) → `docs/architecture/`
- Setup or infrastructure changes → `docs/setup/`
- New specialized processes → `docs/processes/`
- API additions or changes → `docs/api/`"

If yes: wait for the user to write and commit the relevant doc before continuing.
If no: continue immediately.

---

## Step 4: Code review

**REQUIRED SKILL:** Use `superpowers:requesting-code-review` now.

Pass the branch name and change name as context. The review targets the diff between
this branch and the default branch resolved in Step 0.

Do NOT proceed to Step 5 until all blocking review findings are resolved and committed.

---

## Step 5: Clean up branch history

Before landing, rewrite the branch commits into a clean, logical sequence so `git log`
on the default branch tells a clear story. `feature-implement` records in-branch
corrections as `fixup!` commits, so the common case collapses mechanically — no manual
SHA transcription.

**5a — Inspect the branch:**

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
git log $(git merge-base HEAD "$BASE")..HEAD --oneline
```

**5b — Collapse fixups mechanically:**

`--autosquash` arranges every `fixup!`/`squash!` commit under its target automatically,
and `GIT_SEQUENCE_EDITOR=true` accepts that arrangement without opening an editor:

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash $(git merge-base HEAD "$BASE")
```

**5c — Verify, and only hand-edit if noise remains:**

Re-run the 5a command. Each commit should now be one logical unit. If the log is
already clean, continue to Step 6.

If some noise survives (e.g. an early ad-hoc `fix:` that predates the `--fixup`
convention, or several `chore:` infra commits worth grouping into one), fall back to a
manual reorder for *those* commits only:

```bash
BASE=$(node "${CLAUDE_PLUGIN_ROOT}/scripts/default-branch.mjs")
TODO=$(git rev-parse --git-path openpowers-rebase-todo)
GIT_SEQUENCE_EDITOR="cp '$TODO'" git rebase -i $(git merge-base HEAD "$BASE")
```

Before running it, write the todo to the path that
`git rev-parse --git-path openpowers-rebase-todo` prints, with real SHAs from 5a,
applying this policy: `chore:` infra → one setup `pick` at the start; a `fix:`/`docs:`/`test:` that belongs to a feature commit
→ `fixup`/`squash` into it; independent `feat:` → its own `pick`. Then re-run 5c to
confirm.

---

## Step 6: Confirm the landing decision

The next two steps are irreversible markers that this feature shipped: the openspec
archive folds the change into the living spec, and the delivery tag is a permanent
reference. Neither should exist for a branch that never lands, so settle the landing
decision **before** creating them.

Ask:

"How should **<change-name>** land?
1. **Merge** into `$BASE` locally
2. **Push and open a PR**
3. **Keep the branch open** — not landing yet
4. **Discard** the branch"

- **1 or 2** → continue to Step 7. Remember the choice; Step 9 passes it on.
- **3** → stop: "Nothing archived or tagged. Run `/openpowers:feature deliver <change-name>` when you are ready to land."
- **4** → stop and hand off: **REQUIRED SKILL:** Use `superpowers:finishing-a-development-branch` and tell it the user chose to discard. Do not archive and do not tag.

---

## Step 7: Archive the openspec change

Archiving on the branch means the merge carries it, rather than leaving a stray
follow-up commit on the default branch:

```bash
openspec archive <change-name> -y
ls openspec/changes/archive/
```

The change directory should appear with a date prefix. Commit the archive if `openspec`
left it unstaged:

```bash
git add openspec/
git commit -m "spec(<change-name>): archive delivered change"
```

---

## Step 8: Create the delivery tag

Tag the branch tip, now that it contains everything being delivered:

```bash
git tag -a "delivered/<change-name>" \
  -m "spec: <change-name> | <today's date from the currentDate system variable>"
```

---

## Step 9: Land the branch

**REQUIRED SKILL:** Use `superpowers:finishing-a-development-branch` now.

Tell it which option the user chose in Step 6 so it does not re-ask, and mention that
tests were verified earlier in this run. Remind it to push the `delivered/<change-name>`
tag along with the branch if it pushes.
