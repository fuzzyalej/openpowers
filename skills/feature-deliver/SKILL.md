---
name: feature-deliver
description: Run the delivery sequence for a completed feature — mark tasks done, documentation gate, clean branch history, create delivery tag, archive the openspec change, and land the branch. Use via /openpowers:feature deliver <name> or called from feature-implement after all tasks are green.
---

Complete the delivery sequence for a feature whose implementation is done and tests are green.

**Announce at start:** "I'm using the feature-deliver skill to deliver this feature."

**Input:** A change name like `c0001-add-user-auth`. If not provided in `$ARGUMENTS`, run `openspec list` and ask the user to select.

Throughout this skill, `<change-name>` is a placeholder for that name — always substitute the real value.

---

## Step 1: Confirm readiness

Verify:
1. `guidelines.md` exists at the repo root. If it does not, stop: "guidelines.md is missing. Run `/openpowers:feature init` to set up the project before delivering."
2. All tests pass: check `guidelines.md` for the test framework and test command, then run it. If tests fail, stop: "Tests must be green before delivery. Fix the failures and re-run `/openpowers:feature deliver <change-name>`."
3. The change has a `tasks.md` at `openspec/changes/<change-name>/tasks.md`.

---

## Step 2: Mark openspec tasks complete

Read `openspec/changes/<change-name>/tasks.md`.

If all checkboxes are already `- [x]`, skip this step — the file is already up to date.

Otherwise, replace every `- [ ]` with `- [x]`. Write the file back. Then commit:

```bash
rtk git add openspec/changes/<change-name>/tasks.md
rtk git commit -m "spec(<change-name>): mark all tasks complete"
```

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

Pass the branch name and change name as context. The review targets the diff between this branch and `main`.

Do NOT proceed to Step 5 until all blocking review findings are resolved and committed.

---

## Step 5: Clean up branch history

Before tagging and merging, rewrite the branch commits into a clean, logical sequence so `git log` on main tells a clear story. `feature-implement` records in-branch corrections as `fixup!` commits, so the common case collapses mechanically — no manual SHA transcription.

**5a — Inspect the branch:**

```bash
rtk git log $(git merge-base HEAD main)..HEAD --oneline
```

**5b — Collapse fixups mechanically:**

Run the autosquash rebase non-interactively. `--autosquash` arranges every `fixup!`/`squash!` commit under its target automatically, and `GIT_SEQUENCE_EDITOR=true` accepts that arrangement without opening an editor:

```bash
GIT_SEQUENCE_EDITOR=true rtk git rebase -i --autosquash $(git merge-base HEAD main)
```

**5c — Verify, and only hand-edit if noise remains:**

```bash
rtk git log $(git merge-base HEAD main)..HEAD --oneline
```

Each commit should now be one logical unit. If the log is already clean, continue to Step 6.

If some noise survives (e.g. an early ad-hoc `fix:` that predates the `--fixup` convention, or several `chore:` infra commits worth grouping into one), fall back to a manual reorder for *those* commits only:

```bash
GIT_SEQUENCE_EDITOR="cp /tmp/rebase-todo" rtk git rebase -i $(git merge-base HEAD main)
```

Write `/tmp/rebase-todo` with real SHAs from 5a, applying this policy: `chore:` infra → one setup `pick` at the start; a `fix:`/`docs:`/`test:` that belongs to a feature commit → `fixup`/`squash` into it; independent `feat:` → its own `pick`. Then re-run 5c to confirm.

---

## Step 6: Create delivery tag

```bash
rtk git tag -a "delivered/<change-name>" \
  -m "spec: <change-name> | <today's date from the currentDate system variable>"
```

---

## Step 7: Archive the openspec change

```bash
openspec archive <change-name> -y
```

Verify:
```bash
ls openspec/changes/archive/
```
The change directory should appear with a date prefix.

---

## Step 8: Land the branch

**REQUIRED SKILL:** Use `superpowers:finishing-a-development-branch` now.

This skill verifies tests one final time and presents the standard options:
1. Merge locally
2. Push and create a PR
3. Keep the branch open
4. Discard

Follow the skill's own logic for detecting environment and defaulting the recommendation.
