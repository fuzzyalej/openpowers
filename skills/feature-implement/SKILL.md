---
name: feature-implement
description: Implement a feature from its openspec change. Sets up a git worktree, builds an execution brief, executes via subagents on per-task models, then hands off to feature-deliver for delivery. Use via /openpowers:feature implement <name>.
---

Implement a feature from its openspec change.

**Announce at start:** "I'm using the feature-implement skill to implement this feature."

**Input:** A change name like `c0001-add-user-auth`. If not provided in `$ARGUMENTS`, resolve it.

**Optional flags** (anywhere in `$ARGUMENTS`):

| Flag | Effect |
|---|---|
| `--model <alias>` | Run every subagent in this run on `<alias>` (`haiku`, `sonnet`, or `opus`). Turns off escalation. |
| `--economy` | Move every task's model down one tier: `opus` to `sonnet`, `sonnet` to `haiku`. `haiku` stays. |

Remove the flags from `$ARGUMENTS` before you read the change name.

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
- `openspec/changes/<change-name>/proposal.md` (required)
- `openspec/changes/<change-name>/design.md` (optional — may not exist for small changes)
- `openspec/changes/<change-name>/tasks.md` (required)
- `guidelines.md`

If `proposal.md` or `tasks.md` is missing, stop: "The spec for <change-name> is incomplete. Run `/openpowers:feature propose <change-name>` to complete the missing artifacts before implementing." A missing `design.md` is expected for simple changes — proceed without it.

**Resuming an interrupted run is normal.** `tasks.md` is a live record — each task is
ticked as it lands. If some boxes are already `- [x]`, that work is done and committed;
carry only the remaining `- [ ]` lines forward as the checklist. Do not re-implement a
ticked task.

Read these **once**, to synthesize the brief in Step 5. After the brief exists, it becomes the working context — do **not** keep carrying the raw `proposal.md`/`design.md` text through the rest of the run. Retain only the brief and the `tasks.md` checklist. If a specific task later needs a detail the brief omitted, the subagent assigned to it re-reads that one file on demand.

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

Synthesise a **compact shared header** (not a full plan document) as a markdown block in this session. This header is small on purpose — it gets prepended to every subagent dispatch in Step 6, so keep it tight. It must contain:

1. **Goal** — one sentence from the proposal's "Why" section.
2. **Architecture notes** — 3–5 bullet constraints relevant to implementation order, distilled from `design.md` if it exists, otherwise from the proposal and `guidelines.md`. Bullets, not prose; do not paste `design.md` in whole.
3. **Test command** — the test runner from `guidelines.md` (e.g., `npx vitest`).

Keep the remaining unchecked task list (from `tasks.md`, verbatim `- [ ]` format) separately as the checklist — it is *not* part of the per-subagent header.

Do NOT write this to disk. Pass it as inline context to Step 6.

---

## Step 5.5: Resolve models

Do not pick models by hand. Run the helper from the worktree root, adding the flags
the user gave:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/models.mjs" --tasks "openspec/changes/<change-name>/tasks.md" [--model <alias>] [--economy]
```

Keep its output beside the checklist:

- `task.<id>=<model>` — the model for that task's implementer.
- `phase.review=<model>` — the model for task reviews and the final branch review.
- `phase.trivial=<model>` — the model for scoped re-reviews of small fix diffs.
- `escalate=yes|no` — whether Step 6 may escalate.

The tag format, rubric, and phase map are in [model-routing.md](../model-routing.md).

---

## Step 6: Execute the plan

**REQUIRED SKILL:** Use `superpowers:subagent-driven-development` (recommended).
Fallback: `superpowers:executing-plans` (runs in this session with checkpoints).

Execution follows TDD: write failing test → implement minimal code → pass → commit.
A fresh subagent handles each task. Each task is reviewed before the next begins.

**Set the model on every dispatch.** Pass the model from Step 5.5 as the `model`
parameter of each Task/Agent call:

- Implementer: that task's `task.<id>` model.
- Task reviewer and final branch reviewer: `phase.review`.
- Scoped re-review of a small fix diff: `phase.trivial`.
- Batch of small same-shape tasks in one dispatch: the highest model among them.

These models replace the Model Selection guidance in
`superpowers:subagent-driven-development`. Never omit the model; an omitted model
inherits the session model. The `executing-plans` fallback runs in this session,
so per-task models do not apply there.

**Escalate on repeated failure.** This rule replaces the subagent-driven-development
fix-loop escalation. A failure is a red test run or a review with open blocking
findings.

1. If a task fails twice on its Step 5.5 model, and that model is not `opus`, dispatch
   a fresh implementer on `opus` once, with the open findings.
2. If it still fails, stop. Report the task, the models tried, and the open findings
   to the user. Do not start the next task.
3. Never escalate a task that already runs on `opus`. After two failures, stop and
   report.
4. If Step 5.5 printed `escalate=no`, do not escalate. Stop and report after two
   failures.

**Scope each subagent to one task.** Dispatch each subagent with *only* the compact
shared header from Step 5 plus that subagent's **single** task line — never the full
proposal, design, or the whole task list. This keeps per-subagent context to
`header + one task` instead of `header + entire spec`. If a task genuinely needs a
detail the header omitted, that subagent re-reads the one relevant file itself.

**Tick each task as it lands.** Before a subagent commits its task, it flips that
task's line in `openspec/changes/<change-name>/tasks.md` from `- [ ]` to `- [x]` and
stages the file with the rest of its work, so the tick and the code arrive in the same
commit. This makes `tasks.md` a live progress record rather than a checklist rewritten
at the end: `/openpowers:feature` can report real progress, an interrupted run resumes
from the first unticked line, and delivery can verify completion instead of asserting
it. Never tick a task whose tests are not green, and never tick ahead of the work.
Change only `[ ]` to `[x]`. Keep the rest of the line, including the `[model: ...]` tag.

**Commit convention (enables mechanical autosquash at delivery).** Each task's first
commit uses a normal Conventional Commit (`feat:`, `test:`, `fix:` for a genuinely new
concern). Any *correction* to work done earlier in this branch commits with
`git commit --fixup <sha-of-the-commit-it-fixes>` so its message is `fixup! <subject>`.
Do **not** hand-write throwaway `fix: oops` commits for in-branch corrections —
`--fixup` lets `feature-deliver` collapse history with `git rebase --autosquash` and
no manual SHA transcription.

---

## Step 7: Offer delivery

Every task in `tasks.md` is ticked and tests are green. Ask the user:

"Implementation of **<change-name>** is done. Ready to deliver?
- **Yes** → I'll run the delivery sequence (code review, history cleanup, tag, archive, land).
- **No** → Stop here. Run `/openpowers:feature deliver <change-name>` whenever you're ready."

If the user confirms: **REQUIRED SKILL:** Use `feature-deliver` with `<change-name>` as
input, and tell it **tests were verified green in this session** so it can skip its own
redundant test run.
If the user declines: stop. Do not invoke feature-deliver.
