---
name: feature-implement
description: Implement a feature from its openspec change. Sets up a git worktree, builds an execution brief, executes via subagents, then hands off to feature-deliver for delivery. Use via /openpowers:feature implement <name>.
---

Implement a feature from its openspec change.

**Announce at start:** "I'm using the feature-implement skill to implement this feature."

**Input:** A change name like `c0001-add-user-auth`. If not provided in `$ARGUMENTS`, resolve it.

Throughout this skill, `<change-name>` is a placeholder for that resolved name.
Always substitute the real value — never type an example literally.

---

## Step 1: Verify prerequisites

**REQUIRED SKILL:** Use `feature-check-prereqs` with scope `implement`.

---

## Step 2: Resolve change name

If a name was provided, use it directly.

If not provided:
```bash
openspec list --json
```
Display the available changes and ask the user to select one.

Announce: "Implementing change: **<change-name>**"

---

## Step 3: Read openspec artifacts

Check change status:
```bash
openspec status --change "<change-name>" --json
```

Read all context files:
- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/design.md`
- `openspec/changes/<change-name>/tasks.md`
- `guidelines.md`

If any required artifact is missing, stop: "The spec for <change-name> is incomplete. Run `/openpowers:feature propose <change-name>` to complete the missing artifacts before implementing."

Retain the content of all three spec files in context — Step 5 will use them directly without re-reading.

---

## Step 4: Set up isolated workspace

**REQUIRED SKILL:** Use `superpowers:using-git-worktrees` now.

The skill will:
- Detect if already in an isolated workspace (skip creation if so)
- Create branch `feature/<change-name>`
- Place the worktree at `.worktrees/feature-<change-name>` (or existing `.worktrees/` dir)
- Install project dependencies
- Verify a clean test baseline before implementation begins

Do NOT override the skill's directory or branch logic.

---

## Step 5: Build execution brief

Using the content already read in Step 3, plus `guidelines.md` (read it now if not already in context):

Synthesise a concise execution brief (not a full plan document) as a markdown block in this session. It must contain:

1. **Goal** — one sentence from the proposal's "Why" section.
2. **Architecture notes** — key constraints from `design.md` relevant to implementation order.
3. **Task list** — the unchecked tasks from `tasks.md` verbatim, preserving their `- [ ]` format.
4. **Test command** — the test runner from `guidelines.md` (e.g., `rtk vitest`).

Do NOT write this to disk. Pass it as inline context to Step 6.

---

## Step 6: Execute the plan

**REQUIRED SKILL:** Use `superpowers:subagent-driven-development` (recommended).
Fallback: `superpowers:executing-plans` (runs in this session with checkpoints).

Execution follows TDD: write failing test → implement minimal code → pass → commit.
A fresh subagent handles each task. Each task is reviewed before the next begins.

---

## Step 7: Offer delivery

All tasks are complete and tests are green. Ask the user:

"Implementation of **<change-name>** is done. Ready to deliver?
- **Yes** → I'll run the delivery sequence (code review, history cleanup, tag, archive, land).
- **No** → Stop here. Run `/openpowers:feature deliver <change-name>` whenever you're ready."

If the user confirms: **REQUIRED SKILL:** Use `feature-deliver` with `<change-name>` as input.
If the user declines: stop. Do not invoke feature-deliver.
