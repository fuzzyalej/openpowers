---
name: feature-check-prereqs
description: Verify that openpowers prerequisites are met. Checks openspec CLI and required superpowers skills. Called at the start of feature-init, feature-propose, and feature-implement. Accepts an optional scope argument ("propose" or "implement") to widen the superpowers check.
---

Verify openpowers prerequisites.

**Input:** Optional scope — `implement`. Omit for the default (brainstorming-only) check.

---

## Step 1: Check openspec CLI

```bash
openspec --version
```

If this fails, stop and tell the user:
"openspec CLI is required. Install it with: `npm install -g openspec`"

---

## Step 2: Check superpowers skills

Verify the `Skill` tool can reach `superpowers:brainstorming`.

If scope is `implement`, also verify:
- `superpowers:using-git-worktrees`
- `superpowers:subagent-driven-development`
- `superpowers:finishing-a-development-branch`

If any skill is unreachable, stop and tell the user:
"The superpowers plugin is required. Install it with: `/plugins install superpowers@claude-plugins-official`"

---

## Step 3: Confirm

Return silently with no output if all checks pass. The calling skill continues.
