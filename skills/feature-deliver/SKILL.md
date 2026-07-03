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

Before tagging and merging, rewrite the branch commits into a clean, logical sequence so `git log` on main tells a clear story.

**5a — Gather the commits:**

```bash
rtk git log $(git merge-base HEAD main)..HEAD --oneline
```

Read this output carefully. You need the exact SHAs and messages for step 5c.

**5b — Apply the squash policy:**

Group commits by logical unit, not by when they were made:

| Commit type | What to do |
|---|---|
| `fix:` correcting something added in this branch | `fixup` into the feature commit it belongs to |
| `chore:` for infra (gitignore, config, attrs) | group into one setup commit at the start |
| `docs:` or `test:` for a single feature | `fixup` or `squash` into that feature's commit |
| Independent `feat:` or standalone `docs:` | keep as its own `pick` |

Goal: each commit represents one logical unit of work. A reviewer can read the log and understand what was built with no noise.

**5c — Write the rebase sequence using the real SHAs from 5a:**

For example, if step 5a showed:
```
abc1234 feat: add user repository
def5678 fix: correct null check in repository
ghi9012 chore: add .gitignore entries
```

Then the sequence would be:
```
pick ghi9012 chore: add .gitignore entries
pick abc1234 feat: add user repository
fixup def5678 fix: correct null check in repository
```

Write the actual sequence (with real SHAs from your log output) to `/tmp/rebase-todo`:

```bash
cat > /tmp/rebase-todo << 'EOF'
pick <real-sha-1> <real-message-1>
fixup <real-sha-2> <real-message-2>
pick <real-sha-3> <real-message-3>
EOF
```

**5d — Run the non-interactive rebase:**

```bash
GIT_SEQUENCE_EDITOR="cp /tmp/rebase-todo" rtk git rebase -i $(git merge-base HEAD main)
```

**5e — Verify the result:**

```bash
rtk git log --oneline
```

Confirm the log matches the intended clean sequence.

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
